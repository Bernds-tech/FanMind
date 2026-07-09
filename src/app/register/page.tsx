import RegisterClient from "./RegisterClient";

type RegisterPageProps = {
  searchParams: Promise<{ lang?: string | string[]; plan?: string | string[]; ref?: string | string[]; referral_code?: string | string[]; test_plan?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <RegisterClient
      searchParams={searchParams}
      enablePublicDailyTestPlan={process.env.FANMIND_ENABLE_PUBLIC_DAILY_TEST_PLAN === "true"}
    />
  );
}
