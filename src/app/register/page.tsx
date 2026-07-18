import RegisterClient from "./RegisterClient";

type RegisterPageProps = {
  searchParams: Promise<{
    lang?: string | string[];
    plan?: string | string[];
    ref?: string | string[];
    referral_code?: string | string[];
    test_plan?: string | string[];
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <RegisterClient
      searchParams={searchParams}
      // Das interne 1-€/Tag-Testabo bleibt admin-/test-only. Die öffentliche
      // Registrierung bietet ausschließlich Starter Flex und Starter 12 Monate an.
      enablePublicDailyTestPlan={false}
    />
  );
}
