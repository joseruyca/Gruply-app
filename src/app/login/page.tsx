import LoginForm from "./LoginForm";
import { signInWithPasswordAction, signUpWithPasswordAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ e?: string; m?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const error = sp.e ? decodeURIComponent(sp.e) : "";
  const message = sp.m ? decodeURIComponent(sp.m) : "";

  return (
    <LoginForm
      error={error}
      message={message}
      signInAction={signInWithPasswordAction}
      signUpAction={signUpWithPasswordAction}
    />
  );
}
