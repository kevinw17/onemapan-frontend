import Head from "next/head";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login - ONEMAPAN</title>
      </Head>
      <LoginForm />
    </>
  );
}
