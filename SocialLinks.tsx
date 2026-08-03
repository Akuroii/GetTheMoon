import { Pill, Container } from "@/components/ui";
import { PLATFORM_LINKS } from "@/lib/platforms";

export function SocialLinks() {
  return (
    <Container>
      <nav
        aria-label="GetTheMoon on other platforms"
        className="flex flex-wrap justify-center gap-3"
      >
        {PLATFORM_LINKS.map((link) => (
          <Pill key={link.url} tone="social" href={link.url}>
            {link.label}
          </Pill>
        ))}
      </nav>
    </Container>
  );
}
