import Link from "next/link";
import { InstallButton } from "@/components/InstallApp";
import { currentPlayer } from "@/lib/game/auth";

export const dynamic = "force-dynamic";

const districts = [
  {
    title: "Nightlife",
    detail: "Cartel Lifestyle and Orange Room are both in New Owerri. Wetheral Strip stays on the old road.",
    places: ["Cartel Lifestyle", "Orange Room", "Cartel Beach House"],
  },
  {
    title: "Food",
    detail: "From a buka plate to a grill.",
    places: ["Joseph's Pot", "Feedwell", "Crunchies", "Mama Nkechi Buka"],
  },
  {
    title: "Hotels",
    detail: "Works Layout has its own row, plus the New Owerri hotels. An hour or a night, paid in naira.",
    places: ["The Autograph", "Onyx Royal", "Cradle Hotel", "Concord Hotel", "Protea Hotel"],
  },
  {
    title: "Relax",
    detail: "Beach houses and rest hotels in New Owerri.",
    places: ["Cartel Beach House", "Heartland Resort", "Titanium Hotel", "De Moon"],
  },
  {
    title: "Hospitals",
    detail: "Severe sickness can be treated at any of them. Mild sickness can also use the chemist at Eke Ukwu.",
    places: ["Federal Teaching Hospital", "General Hospital", "Umezuruike Hospital", "St David's Hospital"],
  },
  {
    title: "Pickup streets",
    detail: "Opt-in lists. The scene fades to black.",
    places: ["Concord Avenue", "Works Layout", "Hospital Junction"],
  },
  {
    title: "Markets",
    detail: "Trade, stock, and street food.",
    places: ["Eke Ukwu Market", "Relief Market", "Owerri Mall"],
  },
  {
    title: "Airport",
    detail: "Sam Mbakwe, Ngor Okpala. Pay for the flight and the stay together. You land back at home.",
    places: ["Lagos", "Abuja", "Accra", "London"],
  },
  {
    title: "Schools",
    detail: "Apply and you are admitted. Pay the fees, sit the lecture, or drop out.",
    places: ["IMSU", "FUTO", "Federal Polytechnic Nekede"],
  },
  {
    title: "State CID",
    detail: "Report what happened, or call the police on a resident. They get an invite. Miss it and the system arrests them.",
    places: ["State Criminal Investigation Department"],
  },
  {
    title: "Neighbourhoods",
    detail: "Saturday rent starts here.",
    places: ["Ikenegbu", "Aladinma", "New Owerri"],
  },
];

const day = [
  ["Morning", "A shift at the club, the bank, the hospital, or the market."],
  ["Afternoon", "Eat at Mangrove or the buka. Needs drop if you ignore them."],
  ["Night", "Drive up to Cartel Lifestyle. Park, step out, then enter or leave."],
] as const;

const strip = districts.flatMap((district) => district.places);

export default async function HomePage() {
  const player = await currentPlayer();
  return (
    <main className="ol-landing min-h-dvh bg-[#09090b] text-[#f6f1e8]">
      <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <header className="flex items-center justify-between gap-4">
          <p className="font-display text-xl tracking-tight">Owerri Life</p>
          <div className="flex items-center gap-2">
            <InstallButton />
          {player ? (
            <Link href="/play" className="rounded-full bg-[#f6f1e8] px-4 py-2 text-sm font-semibold text-[#09090b]">
              Back to the city
            </Link>
          ) : (
            <Link href="/login" className="rounded-full border border-[#f6f1e8] px-4 py-2 text-sm font-semibold text-[#f6f1e8]">
              Sign in
            </Link>
          )}
          </div>
        </header>

        <section className="relative mt-10 overflow-hidden rounded-[2rem] bg-[#f6f1e8] text-[#09090b] md:mt-14">
          <div className="grid items-end gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c4321a]">A shared city · 18+</p>
              <h1 className="mt-4 max-w-xl font-display text-5xl leading-[0.88] md:text-7xl">
                Live the week
                <span className="mt-3 block bg-[#09090b] px-3 py-1 text-[#f6f1e8]">in Owerri.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[#2a2a2a]">
                Work a shift, eat, pay Saturday rent, and move through the city one place at a time. Naira stays in the game. The server writes every balance.
              </p>
              <div className="mt-8">
                {player ? (
                  <Link href="/play" className="inline-block rounded-full bg-[#c4321a] px-5 py-3 font-semibold text-[#f6f1e8]">
                    Continue
                  </Link>
                ) : (
                  <Link href="/join" className="inline-block rounded-full bg-[#c4321a] px-5 py-3 font-semibold text-[#f6f1e8]">
                    Create your person
                  </Link>
                )}
              </div>
            </div>
            <div className="ol-night relative min-h-52 overflow-hidden rounded-[1.4rem] bg-[#09090b] text-[#f6f1e8]" aria-hidden>
              <span className="ol-beam" />
              <span className="ol-beam ol-beam-late" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-[#141414]">
                <span className="ol-lane" />
              </div>
              <p className="absolute left-5 top-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffb020]">Night road</p>
              <p className="absolute bottom-20 left-5 font-display text-3xl leading-none">Cartel is open.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="ol-marquee border-y border-[#f6f1e8]/20 bg-[#c4321a] py-3 text-sm font-semibold text-[#f6f1e8]">
        <div className="ol-marquee-track">
          {[...strip, ...strip].map((name, index) => (
            <span key={`${name}-${index}`} className="px-4">
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5">
        <section className="mt-12 grid gap-3 md:grid-cols-3">
          {day.map(([title, line], index) => (
            <article
              key={title}
              className={index === 1 ? "rounded-[1.4rem] bg-[#f6f1e8] p-5 text-[#09090b]" : "rounded-[1.4rem] border border-[#f6f1e8]/20 bg-[#141414] p-5 text-[#f6f1e8]"}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c4321a]">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-3 font-display text-3xl">{title}</h2>
              <p className="mt-2 text-sm leading-6">{line}</p>
            </article>
          ))}
        </section>

      </div>

      <section className="relative mt-14 overflow-hidden">
        <img src="/city-night.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_70%]" />
        <div className="absolute inset-0 bg-[#09090b]/25" />
        <div className="relative mx-auto max-w-6xl px-5 py-14">
          <h2 className="font-display text-4xl leading-none md:text-5xl">The city, one district at a time</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#f6f1e8]">Names sit in a list under the map. The map itself keeps a single label for the place you picked.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {districts.map((district) => (
              <article key={district.title} className="ol-frost rounded-[1.4rem] p-5 text-[#f6f1e8]">
                <h3 className="font-display text-2xl">{district.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#f6f1e8]">{district.detail}</p>
                <ul className="mt-4 space-y-2">
                  {district.places.map((name) => (
                    <li key={name} className="ol-glass-chip rounded-xl px-3 py-2 text-sm font-semibold text-[#09090b]">
                      {name}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-14">
        <p className="mt-12 text-xs leading-5 text-[#c8c2b6]">Two accounts on this computer share one Owerri. Pickup scenes fade to black. Nothing explicit is shown.</p>
      </div>
    </main>
  );
}
