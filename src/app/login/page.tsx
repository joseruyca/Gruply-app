import LoginForm from "./LoginForm";

export default async function LoginPage(props: {
  searchParams?: Promise<{ e?: string; m?: string }> | { e?: string; m?: string };
}) {
  const sp: any = await props.searchParams;
  const error = sp?.e ? decodeURIComponent(sp.e) : "";
  const message = sp?.m ? decodeURIComponent(sp.m) : "";

  return <LoginForm error={error} message={message} />;
}
