import { AuthForm } from "@/components/auth/AuthForm";
import { login, signup } from "@/app/auth/actions";
import { TackModal } from "@/components/ui/TackModal";

type AuthModalProps = {
  mode: "login" | "signup";
  redirectTo?: string;
  error?: string;
  message?: string;
};

const copy = {
  login: {
    title: "Welcome back",
  },
  signup: {
    title: "Create your account",
  },
};

export function AuthModal({
  mode,
  redirectTo = "/dashboard",
  error,
  message,
}: AuthModalProps) {
  const { title } = copy[mode];

  return (
    <TackModal title={title} closeHref="/">
      <AuthForm
        mode={mode}
        action={mode === "login" ? login : signup}
        redirectTo={redirectTo}
        error={error}
        message={message}
      />
    </TackModal>
  );
}
