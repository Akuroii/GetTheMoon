import { Container, SectionLabel } from "@/components/ui";
import type { ChannelStats } from "@/lib/types";
import { AvatarOrbit } from "./AvatarOrbit";
import { SubscriberCount } from "./SubscriberCount";
import { Tagline } from "./Tagline";

export function Hero({ initialStats }: { initialStats: ChannelStats }) {
  return (
    <section className="pt-16 pb-[var(--space-section)] sm:pt-24">
      <Container className="flex flex-col items-center gap-8 text-center">
        <div>
          <SectionLabel>The Subscriber Watch</SectionLabel>
          <Tagline />
          <p className="mt-3 text-sm text-[var(--text-dim)]">
            Updating on its own — no refresh needed.
          </p>
        </div>

        <AvatarOrbit
          avatarSrc={initialStats.avatarUrlYoutube}
          avatarAlt="GetTheMoon's creator"
        />

        <SubscriberCount initialStats={initialStats} />
      </Container>
    </section>
  );
}
