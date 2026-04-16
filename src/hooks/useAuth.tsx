import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  SelectUser,
  InsertUser,
  LoginUser,
  CurrentUserResponse,
  UserLearningLanguage,
  LanguageOption,
} from "@/lib/types";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import toast from "react-hot-toast";

type LoginResponse = {
  token: {
    accessTk: string;
    refreshTk: string;
  };
  user: SelectUser;
};

type RegisterResponse = {
  success: boolean;
  message: string;
};

type AuthContextType = {
  user: SelectUser | null;
  learningLanguages: UserLearningLanguage[];
  nativeLanguage: LanguageOption | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<RegisterResponse, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const currentUserQueryFn = getQueryFn<CurrentUserResponse | null>({
    on401: "returnNull",
  });

  const {
    data: currentUser,
    error,
    isLoading,
  } = useQuery<CurrentUserResponse | null>({
    queryKey: ["/api/user/"],
    queryFn: currentUserQueryFn,
    staleTime: 0,
    refetchOnMount: true,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return (await res.json()) as LoginResponse;
    },
    onSuccess: (response: LoginResponse) => {
      localStorage.setItem("accessToken", response.token.accessTk);
      localStorage.setItem("refreshToken", response.token.refreshTk);

      queryClient.setQueryData(["/api/user/"], {
        user: response.user,
        learningLanguages: [],
        nativeLanguage: null,
      });
      toast("welcome back")
      // toast({
      //   title: "Welcome back!",
      //   description: `You've successfully logged in.`,
      // });
    },
    onError: (error: Error) => {
      toast.error("login failed", {
      })
      // toast({
      //   title: "Login failed",
      //   description: error.message,
      //   variant: "destructive",
      // });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return (await res.json()) as RegisterResponse;
    },
    onSuccess: () => {
      toast("welcome to mentarie")
      // toast({
      //   title: "Welcome to LinguaConverse!",
      //   description: "Your account has been created successfully.",
      // });
    },
    onError: (error: Error) => {
      toast("registration failed")
      // toast({
      //   title: "Registration failed",
      //   description: error.message,
      //   variant: "destructive",
      // });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(["/api/user/"], null);
      toast("logged out")
      // toast({
      //   title: "Logged out",
      //   description: "You've been successfully logged out.",
      // });
    },
    onError: (error: Error) => {
      toast("logout failed")
      // toast({
      //   title: "Logout failed",
      //   description: error.message,
      //   variant: "destructive",
      // });
    },
  });
  
  return (
    <AuthContext.Provider
      value={{
        user: currentUser?.user ?? null,
        learningLanguages: currentUser?.learningLanguages ?? [],
        nativeLanguage: currentUser?.nativeLanguage ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
