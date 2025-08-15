import AppHeader from "../components/common/AppHeader";
import WhatsNew from "../components/common/WhatsNew";

export default function WhatsNewPage() {
  return (
    <main className="min-h-screen flex flex-col relative z-10 px-4" data-testid="whats-new-page">
      <AppHeader />
      <div className="w-full mt-6">
        <WhatsNew />
      </div>
    </main>
  );
}
