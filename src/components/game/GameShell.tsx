"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { InstallButton } from "@/components/InstallApp";
import { CityWorld } from "@/components/game/CityWorld";
import { ArrivalScene, HouseRoom, PersonFigure, VenueInterior } from "@/components/game/scenes";
import {
  acceptFriendRequest,
  addFriend,
  blockPerson,
  changeHome,
  clearArrears,
  doDorime,
  deleteDirectLine,
  deleteVenueLine,
  declineFriendRequest,
  doWork,
  eatBuka,
  eatGrill,
  applyForCourse,
  callPolice,
  checkoutRoom,
  enterDoor,
  fileActivity,
  takeFlight,
  getTreatment,
  honourPoliceInvite,
  goOutside,
  hitDanceFloor,
  leaveJob,
  leaveSchool,
  letTimePass,
  addTopUp,
  buyFurniture,
  buyPlot,
  goMeet,
  logout,
  makeOffer,
  orderFood,
  payFees,
  loadBooking,
  newGames,
  placeSlip,
  playGames,
  sayInVenue,
  serveCustody,
  sitLecture,
  sleepAtHotel,
  sendFriendRequest,
  sendMessage,
  setWealthPrivacy,
  showerAtHome,
  sleepAtHome,
  socialise,
  spray,
  takeDrink,
  takeJob,
  takeRoom,
  unblockPerson,
  useRestroom,
  go,
} from "@/lib/game/actions";
import { BET_STAKES, CAREERS, DREAMS, HOMES, LANDS, NPCS, PLACES, TOP_UPS, TRAITS, TREATMENT_FEE, TRIPS, careerById, coursesAt, homeById, lectureLabel, placeActs, placeById, type Course } from "@/lib/game/content";
import { POLICE_ID, multiplyOdds, travelOptions } from "@/lib/game/engine";
import { clockLabel, dreamProgress, jobTitle, levelPay, moodLabel, naira, skillLabel, skillNeeded, weekday } from "@/lib/game/format";
import type { GameView, PersonCard } from "@/lib/game/queries";
import type { BetPick, TravelMode, WorkStyle } from "@/lib/game/types";

type Run = (
  work: () => Promise<{ ok: true; notice?: string } | { ok: false; error: string }>,
) => Promise<{ ok: true; notice?: string } | { ok: false; error: string }>;
type Tab = "home" | "map" | "phone" | "people" | "bets" | "ledger";

const styles: Array<{ id: WorkStyle; name: string; detail: string }> = [
  { id: "steady", name: "Steady", detail: "Reliable shift." },
  { id: "jaguda", name: "Work like jaguda", detail: "Big performance. Drains energy and fun." },
  { id: "gist", name: "Gist with colleagues", detail: "Social up, lighter output." },
  { id: "oga", name: "Suck up to Oga", detail: "Charisma helps." },
  { id: "easy", name: "Take am easy", detail: "Less pay, less drain." },
  { id: "leave", name: "Leave early", detail: "Half pay, four hours." },
];

export function GameShell({ view }: { view: GameView }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [toast, setToast] = useState<{ id: number; text: string; bad: boolean } | null>(null);
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [account, setAccount] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(work: Parameters<Run>[0]) {
    return new Promise<{ ok: true; notice?: string } | { ok: false; error: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await work();
          flash(result.ok ? result.notice ?? "" : result.error, !result.ok);
          if (result.ok) router.refresh();
          resolve(result);
        } catch (error) {
          const failed = { ok: false as const, error: error instanceof Error ? error.message : "The city hiccuped. Try again." };
          flash(failed.error, true);
          resolve(failed);
        }
      });
    });
  }

  function flash(text: string, bad: boolean) {
    if (!text) {
      setToast(null);
      return;
    }
    const id = Date.now();
    setToast({ id, text, bad });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4800);
  }

  useEffect(() => {
    const place = placeById(view.me.locationId);
    const club = view.me.indoors && (place.kind === "nightlife" || place.id === "concord-hotel");
    if (!club) return;
    const timer = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [router, view.me.indoors, view.me.locationId]);

  const person = [...view.nearby, ...view.known, ...view.city].find((item) => item.id === personId) ?? null;
  const me = view.me;
  const crowd = [...view.calls].reverse().find((call) => call.fromId !== me.id);
  const crowdText = crowd
    ? crowd.kind === "spray"
      ? `${crowd.fromName} sprayed ${naira(crowd.amount)}`
      : `${crowd.fromName} did dorime · ${naira(crowd.amount)}`
    : null;
  const [phone, setPhone] = useState<HTMLDivElement | null>(null);
  const [furnishToken, setFurnishToken] = useState(0);

  useEffect(() => {
    const block = (event: WheelEvent) => {
      if (event.ctrlKey) event.preventDefault();
    };
    window.addEventListener("wheel", block, { passive: false });
    return () => window.removeEventListener("wheel", block);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#d7ebdd] text-[#17241e]">
      <div ref={setPhone} className="relative h-full w-full overflow-hidden">
        {toast ? (
          <p
            key={toast.id}
            className={`ol-toast pointer-events-none absolute inset-x-3 top-[4.5rem] z-30 rounded-2xl px-3 py-2 text-sm shadow-lg ${toast.bad ? "bg-[#f3d6cc] text-[#7a2e1e]" : "bg-[#e5f2df] text-[#143d2c]"}`}
            onAnimationEnd={() => setToast(null)}
          >
            {toast.text}
          </p>
        ) : crowdText ? (
          <p className="pointer-events-none absolute inset-x-3 top-[4.5rem] z-30 rounded-2xl bg-[#e5f2df] px-3 py-2 text-sm text-[#143d2c] shadow-lg">
            {crowdText}
          </p>
        ) : null}
        <main className={`absolute inset-0 ${!account && tab === "home" ? "overflow-hidden" : !account && tab === "phone" ? "overflow-hidden px-3 pb-24 pt-[4.5rem]" : "overflow-y-auto px-4 pb-28 pt-20"}`}>
          {account ? <AccountPage view={view} pending={pending} run={run} onBack={() => setAccount(false)} /> : null}
          {!account && tab === "home" ? <HomePanel view={view} run={run} pending={pending} furnishToken={furnishToken} onOpenMap={() => setTab("map")} /> : null}
          {!account && tab === "map" ? <MapPanel view={view} run={run} pending={pending} onOpen={setPersonId} sheetRoot={phone} /> : null}
          {!account && tab === "phone" ? (
            <PhonePanel
              view={view}
              run={run}
              pending={pending}
              onArrived={() => setTab("map")}
              onOpen={setPersonId}
              onMeet={(id) => {
                run(() => goMeet(id)).then((result) => {
                  if (result.ok) setTab("map");
                });
              }}
            />
          ) : null}
          {!account && tab === "bets" ? <BetsPanel view={view} run={run} pending={pending} /> : null}
          {!account && tab === "people" ? (
            <div className="flex h-full min-h-0 flex-col">
              <PeoplePanel
                view={view}
                run={run}
                pending={pending}
                peerId={chatWith}
                onPeer={setChatWith}
                onOpen={setPersonId}
                onMeet={(id) => {
                  run(() => goMeet(id)).then((result) => {
                    if (result.ok) {
                      setChatWith(null);
                      setTab("map");
                    }
                  });
                }}
              />
            </div>
          ) : null}
          {!account && tab === "ledger" ? <LedgerPanel view={view} /> : null}
        </main>
        <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3">
          <div className="pointer-events-auto flex max-w-full items-center gap-3 overflow-x-auto rounded-full bg-white px-4 py-2 text-sm shadow-lg">
            <span className="shrink-0 font-semibold">{clockLabel(me.day, me.hour)}</span>
            <span className="shrink-0 text-[#5d6b62]">{moodLabel(me.needs, me.sick)}</span>
            <span className="shrink-0 text-[#5d6b62]">{view.city.length} online</span>
            <InstallButton />
            <button type="button" className="flex shrink-0 items-center gap-1 rounded-full bg-[#eef6ea] py-1 pl-3 pr-1 font-semibold" aria-label="Your balance" onClick={() => setTopUpOpen(true)}>
              {naira(view.balance)}
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#1f6b45] text-sm text-white">+</span>
            </button>
          </div>
        </div>
        <div className="absolute bottom-24 left-3 z-30 flex items-center gap-2">
          <button type="button" aria-label="Your account" onClick={() => setAccount(true)} className="rounded-full bg-white p-1 shadow-lg">
            <Avatar look={me.look} name={me.username} size={48} />
          </button>
          <div className="grid grid-cols-3 gap-1 rounded-full bg-white px-3 py-2 shadow-lg">
            {(
              [
                ["Hunger", me.needs.hunger, "bg-[#e07a3d]"],
                ["Energy", me.needs.energy, "bg-[#e0b15a]"],
                ["Hygiene", me.needs.hygiene, "bg-[#3d7ea6]"],
                ["Bladder", me.needs.bladder, "bg-[#7a5ea7]"],
                ["Fun", me.needs.fun, "bg-[#c4552a]"],
                ["Social", me.needs.social, "bg-[#1f6b45]"],
              ] as const
            ).map(([label, value, color]) => (
              <span key={label} title={`${label} ${value}`} className="block h-1.5 w-8 overflow-hidden rounded-full bg-[#efe4d2]">
                <span className={`block h-full ${color}`} style={{ width: `${value}%` }} />
              </span>
            ))}
          </div>
        </div>
        <nav className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white p-1.5 text-[11px] font-semibold shadow-xl">
          <button type="button" className={`flex w-16 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 ${!account && tab === "home" ? "bg-[#17241e] text-white" : "text-[#5d6b62]"}`} onClick={() => { setAccount(false); setTab("home"); }}><span className="text-base leading-none">⌂</span>Home</button>
          <button
            type="button"
            className="flex w-16 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[#5d6b62]"
            onClick={() => {
              setAccount(false);
              setTab("home");
              const home = homeById(me.homeId);
              if (me.locationId !== home.areaId) {
                flash("Go home first. Buy opens the furniture in your house.", true);
                return;
              }
              if (!me.indoors) run(enterDoor);
              setFurnishToken((value) => value + 1);
            }}
          >
            <span className="text-base leading-none">▣</span>Buy
          </button>
          <button type="button" className={`flex w-16 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 ${!account && tab === "map" ? "bg-[#17241e] text-white" : "text-[#5d6b62]"}`} onClick={() => { setAccount(false); setTab("map"); }}><span className="text-base leading-none">⌖</span>Map</button>
          <button type="button" className={`flex w-16 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 ${!account && tab === "phone" ? "bg-[#17241e] text-white" : "text-[#5d6b62]"}`} onClick={() => { setAccount(false); setTab("phone"); }}><span className="text-base leading-none">▢</span>Phone</button>
        </nav>
        {person ? (
          <PersonSheet
            person={person}
            view={view}
            pending={pending}
            run={run}
            onClose={() => setPersonId(null)}
            onMessage={(id) => {
              setChatWith(id);
              setTab("people");
              setPersonId(null);
            }}
            onMeet={(id) => {
              run(() => goMeet(id)).then((result) => {
                if (result.ok) {
                  setPersonId(null);
                  setTab("map");
                }
              });
            }}
          />
        ) : null}
        {topUpOpen && phone
          ? createPortal(
              <SlideSheet
                label="Wallet"
                title="Top up"
                detail="In-game naira only. Purchased naira cannot pay a meet-up."
                onClose={() => setTopUpOpen(false)}
              >
                <div className="grid gap-2">
                  {TOP_UPS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => addTopUp(amount)).then((result) => {
                          if (result.ok) setTopUpOpen(false);
                        })
                      }
                      className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-left text-sm disabled:opacity-40"
                    >
                      <span className="font-semibold">{naira(amount)}</span>
                      <span className="text-xs font-semibold text-[#1f6b45]">Add</span>
                    </button>
                  ))}
                </div>
              </SlideSheet>,
              phone,
            )
          : null}
      </div>
      <button
        className="mx-auto mt-3 hidden text-xs text-[#d5e4d8] md:block"
        onClick={() =>
          run(async () => {
            const result = await logout();
            if (result.ok) router.push("/");
            return result;
          })
        }
      >
        Sign out
      </button>
    </div>
  );
}

function AccountPage({
  view,
  pending,
  run,
  onBack,
}: {
  view: GameView;
  pending: boolean;
  run: Run;
  onBack: () => void;
}) {
  const router = useRouter();
  const me = view.me;
  const home = homeById(me.homeId);
  const dream = DREAMS.find((item) => item.id === me.dream);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-[#1f6b45]">Back</button>
      <section className="rounded-[1.6rem] bg-white p-4">
        <div className="flex items-center gap-3">
          <Avatar look={me.look} name={me.username} size={72} />
          <div className="min-w-0">
            <h2 className="truncate font-display text-3xl leading-none">{me.username}</h2>
            <p className="mt-1 truncate text-sm text-[#5d6b62]">{me.email}</p>
          </div>
        </div>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-[#5d6b62]">Gender</dt><dd className="text-right font-semibold">{me.gender === "female" ? "Female" : me.gender === "male" ? "Male" : "Not set"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#5d6b62]">Where</dt><dd className="text-right font-semibold">{placeById(me.locationId).name}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#5d6b62]">Home</dt><dd className="text-right font-semibold">{home.name}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#5d6b62]">Dream</dt><dd className="text-right font-semibold">{dream?.name}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#5d6b62]">Work</dt><dd className="text-right font-semibold">{jobTitle(me)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#5d6b62]">Car</dt><dd className="text-right font-semibold">{me.hasCar ? "Yes" : "No"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#5d6b62]">Start</dt><dd className="text-right font-semibold">{me.lottery === "heir" ? "Heir" : "Struggle"}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-[#5d6b62]">{me.traits.map((id) => TRAITS.find((trait) => trait.id === id)?.name).join(" · ")}</p>
      </section>
      <section className="rounded-[1.6rem] bg-[#143d2c] p-4 text-[#f6f1e6]">
        <p className="text-xs uppercase tracking-[0.16em] text-[#d5e4d8]">Balance</p>
        <p className="font-display text-3xl">{naira(view.balance)}</p>
        <p className="mt-2 text-xs text-[#d5e4d8]">Earned {naira(view.pools.earned)} · Gifted {naira(view.pools.gifted)} · Purchased {naira(view.pools.purchased)}</p>
        <p className="mt-2 text-xs text-[#d5e4d8]">Top up adds purchased naira. It cannot pay a meet-up.</p>
      </section>
      <section className="rounded-[1.6rem] bg-white p-4">
        <h3 className="font-semibold">Skills</h3>
        <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
          {(Object.keys(me.skills) as Array<keyof typeof me.skills>).map((skill) => (
            <li key={skill} className="flex justify-between gap-2">
              <span className="text-[#5d6b62]">{skillLabel(skill)}</span>
              <span className="font-semibold">{me.skills[skill].toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </section>
      <button
        type="button"
        disabled={pending}
        className="w-full rounded-full border border-[#e4d8c4] bg-white py-3 text-sm font-semibold text-[#b5523a] disabled:opacity-40"
        onClick={() =>
          run(async () => {
            const result = await logout();
            if (result.ok) router.push("/");
            return result;
          })
        }
      >
        Sign out
      </button>
    </div>
  );
}

function PlaceTrip({
  placeId,
  view,
  pending,
  run,
  onClose,
  onEntered,
}: {
  placeId: string;
  view: GameView;
  pending: boolean;
  run: Run;
  onClose: () => void;
  onEntered: () => void;
}) {
  const place = placeById(placeId);
  const here = place.id === view.me.locationId;
  const rides = here ? [] : travelOptions(view.me.locationId, place.id, view.me.hasCar, view.balance);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/35 p-3 sm:items-center" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-[1.6rem] bg-[#fffaf2] p-4 text-[#17241e] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">{place.area}</p>
            <h2 className="font-display text-3xl leading-none">{place.name}</h2>
            <p className="mt-1 text-sm text-[#5d6b62]">{place.hours}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white px-3 py-1 text-sm font-semibold">Close</button>
        </div>
        <p className="mt-3 text-sm leading-6">{place.summary}</p>
        {place.activities.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {place.activities.map((activity) => (
              <span key={activity} className="rounded-full bg-[#efe4d2] px-2 py-1 text-[11px] font-semibold text-[#5d6b62]">{activity}</span>
            ))}
          </div>
        ) : null}
        {here ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              run(enterDoor).then((result) => {
                if (result.ok) {
                  onClose();
                  onEntered();
                }
              });
            }}
            className="mt-4 w-full rounded-full bg-[#17241e] py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Go inside
          </button>
        ) : (
          <div className="mt-4 grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Go there</p>
            {rides.map((option) => (
              <button
                key={option.mode}
                type="button"
                disabled={pending || !option.available || !option.affordable}
                onClick={() => {
                  run(() => go(place.id, option.mode)).then((result) => {
                    if (result.ok) onClose();
                  });
                }}
                className="flex items-center justify-between rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3 text-left text-sm disabled:opacity-40"
              >
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  <span className="text-[#5d6b62]">{option.hours}h{option.reason ? ` · ${option.reason}` : ""}</span>
                </span>
                <span className="font-semibold">{option.cost === 0 ? "Free" : naira(option.cost)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function HomePanel({ view, run, pending, furnishToken, onOpenMap }: { view: GameView; run: Run; pending: boolean; furnishToken: number; onOpenMap: () => void }) {
  const router = useRouter();
  const [roomOpen, setRoomOpen] = useState(false);
  const furnishSeen = useRef(furnishToken);
  const me = view.me;
  const home = homeById(me.homeId);
  const atHome = me.locationId === home.areaId;
  if (furnishToken !== furnishSeen.current) {
    furnishSeen.current = furnishToken;
    if (atHome && !roomOpen) setRoomOpen(true);
  }
  const here = placeById(me.locationId);
  const ward = NPCS.find((npc) => npc.placeId === me.locationId && (npc.role === "Doctor" || npc.role === "Nurse" || npc.role === "Chemist"));
  const clinic = here.kind === "health" || here.id === "eke-ukwu";
  const treatPrice = TREATMENT_FEE[me.locationId] ?? null;
  const homeRides = atHome ? [] : travelOptions(me.locationId, home.areaId, me.hasCar, view.balance);
  const progress = dreamProgress(me, view.balance);
  const ratio = Math.min(1, progress.target === 0 ? 0 : progress.current / progress.target);
  const career = me.job ? careerById(me.job.careerId) : null;

  const [lifeOpen, setLifeOpen] = useState(false);
  const [pickedPlace, setPickedPlace] = useState<string | null>(null);

  return (
    <div className="relative h-full">
      <section className="absolute inset-0 overflow-hidden bg-[#d7ebdd]">
        {atHome && me.indoors && roomOpen ? (
          <div className="h-full overflow-y-auto p-3">
            <button type="button" onClick={() => setRoomOpen(false)} className="mb-3 text-xs font-semibold text-[#143d2c]">
              Back to the map
            </button>
            <HouseRoom name={home.name} look={me.look} owned={me.furniture} pending={pending} onBuy={(itemId) => run(() => buyFurniture(itemId))} />
          </div>
        ) : (
          <>
            <CityWorld homeAreaId={home.areaId} locationId={me.locationId} onSelect={setPickedPlace} />
            {atHome ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (me.indoors) {
                    setRoomOpen(true);
                    return;
                  }
                  run(enterDoor).then((result) => {
                    if (result.ok) setRoomOpen(true);
                  });
                }}
                className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#17241e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {me.indoors ? "See the room" : "Go inside"}
              </button>
            ) : null}
            <button type="button" onClick={() => setLifeOpen((open) => !open)} className="absolute left-3 top-20 z-10 rounded-full bg-white px-3 py-2 text-xs font-semibold shadow">
              {lifeOpen ? "Hide" : "Your life"}
            </button>
          </>
        )}
      </section>
      {pickedPlace ? <PlaceTrip placeId={pickedPlace} view={view} pending={pending} run={run} onClose={() => setPickedPlace(null)} onEntered={onOpenMap} /> : null}
      {lifeOpen ? <div className="absolute bottom-24 left-3 top-32 z-20 w-[min(24rem,calc(100%-1.5rem))] space-y-4 overflow-y-auto">
      <section className="rounded-[1.6rem] bg-[#143d2c] p-5 text-[#f6f1e6]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e0b15a]">{moodLabel(me.needs, me.sick)}</p>
        <h2 className="mt-1 font-display text-3xl leading-tight">{DREAMS.find((dream) => dream.id === me.dream)?.name}</h2>
        <p className="mt-2 text-sm leading-6 text-[#d5e4d8]">{progress.text}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full bg-[#e0b15a]" style={{ width: `${ratio * 100}%` }} />
        </div>
        <p className="mt-4 text-sm text-[#d5e4d8]">
          {me.traits.map((id) => TRAITS.find((trait) => trait.id === id)?.name).join(" · ")} · {me.lottery === "heir" ? "Heir" : "Struggle"}
        </p>
      </section>
      {me.custody ? (
        <section className="rounded-2xl bg-[#f3d6cc] px-4 py-3 text-sm text-[#7a2e1e]">
          <p>You are in custody at the State CID until {me.custody}.</p>
          <button className="mt-2 rounded-full bg-[#7a2e1e] px-3 py-2 text-xs font-semibold text-[#f6f1e6]" disabled={pending} onClick={() => run(serveCustody)}>
            Serve the detention
          </button>
        </section>
      ) : null}
      {me.school ? (
        <section className="rounded-2xl bg-white px-4 py-3 text-sm">
          <p className="font-semibold">{me.school.school} · {me.school.course}</p>
          <p className="mt-1 text-[#5d6b62]">{me.school.status === "admitted" ? "Admitted" : "Waiting on admission after midnight"} · {me.school.when}</p>
          <p className="text-[#5d6b62]">{me.school.feesPaid ? "School fees paid." : `School fees ${naira(me.school.fee)} before lectures.`}</p>
        </section>
      ) : null}
      {me.room ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm">You have a {me.room.stay} room at {placeById(me.room.placeId).name}. Go in and lie down.</p>
      ) : null}
      {me.policeInvite ? (
        <section className="rounded-2xl bg-[#fffaf2] px-4 py-3 text-sm">
          <p className="font-semibold">State CID invite</p>
          <p className="mt-1 text-[#5d6b62]">Come inside the station on Port Harcourt Road before {me.policeInvite.deadline}. If you do not honour it, you are arrested.</p>
          <p className="mt-1">{me.policeInvite.note}</p>
        </section>
      ) : null}
      {clinic && me.indoors && treatPrice != null ? (
        <section className="rounded-[1.6rem] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">{here.kind === "health" ? "Doctor" : "Chemist"}</p>
          <p className="mt-1 font-display text-2xl leading-tight">{ward?.name ?? here.name}</p>
          <p className="mt-2 text-sm leading-6 text-[#5d6b62]">{ward?.bio ?? "They can clear a sickness."}</p>
          <button
            type="button"
            disabled={pending || me.sick === "none"}
            onClick={() => run(getTreatment)}
            className="mt-3 w-full rounded-full bg-[#143d2c] py-3 text-sm font-semibold text-[#f6f1e6] disabled:opacity-40"
          >
            {me.sick === "none" ? "You are not sick" : `Get treatment · ${naira(treatPrice)}`}
          </button>
          <p className="mt-2 text-xs text-[#5d6b62]">The price leaves your balance. It takes 2 hours and clears the sickness.</p>
        </section>
      ) : null}
      {me.sick !== "none" && !(clinic && me.indoors) ? (
        <p className="rounded-2xl bg-[#f3d6cc] px-4 py-3 text-sm text-[#7a2e1e]">
          {me.sick === "severe" ? "You are very sick. Open Map, tap Health, go inside a hospital, and pay the doctor." : "You feel sick. A chemist at Eke Ukwu is ₦1,500, or any hospital can see you."}
        </p>
      ) : null}
      <section className="grid gap-3">
        <div className="rounded-[1.6rem] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Work</p>
          <p className="mt-1 font-display text-2xl leading-tight">{jobTitle(me)}</p>
          {career ? (
            <p className="mt-2 text-sm leading-6 text-[#5d6b62]">
              Performance {Math.round(me.job?.performance ?? 0)}%. {skillLabel(career.skill)} {me.skills[career.skill].toFixed(1)}
              {me.job && me.job.level < 5 ? `. Next level wants skill ${skillNeeded(me.job.level + 1)}.` : ""}
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-[#5d6b62]">Open the phone and take a job. It starts the next morning.</p>
          )}
        </div>
        <div className="rounded-[1.6rem] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Home</p>
          <p className="mt-1 font-display text-2xl leading-tight">{home.name}</p>
          <p className="mt-2 text-sm leading-6 text-[#5d6b62]">
            {naira(home.rent)} every Saturday
            {me.arrears > 0 ? `. Arrears ${naira(me.arrears)}` : ""}
            {me.loanRemaining > 0 ? `. Loan ${naira(me.loanRemaining)}` : ""}
          </p>
        </div>
      </section>
      {atHome ? (
        <section className="rounded-[1.6rem] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">You are home</p>
          <p className="mt-1 text-sm text-[#5d6b62]">Sleep fills energy and takes you to 7 in the morning. A shower fills hygiene and takes an hour.</p>
          <div className="mt-3 grid gap-2">
            <Action disabled={pending} onClick={() => run(sleepAtHome)}>Sleep until morning</Action>
            <Action disabled={pending} onClick={() => run(showerAtHome)}>Shower</Action>
          </div>
        </section>
      ) : (
        <section className="rounded-[1.6rem] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Go home</p>
          <p className="mt-1 font-display text-2xl leading-tight">{home.name}</p>
          <p className="mt-2 text-sm leading-6 text-[#5d6b62]">You are at {here.name}. Sleep and a shower only work at home. Pick a ride back.</p>
          <div className="mt-3 grid gap-2">
            {homeRides.map((option) => (
              <button
                key={option.mode}
                type="button"
                disabled={pending || !option.available || !option.affordable}
                onClick={() => run(() => go(home.areaId, option.mode))}
                className="flex items-center justify-between rounded-2xl border border-[#e4d8c4] px-3 py-3 text-left text-sm disabled:opacity-40"
              >
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  <span className="text-[#5d6b62]">{option.hours}h{option.reason ? ` · ${option.reason}` : ""}</span>
                </span>
                <span className="font-semibold">{option.cost === 0 ? "Free" : naira(option.cost)}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Action disabled={pending} onClick={() => run(useRestroom)}>Restroom</Action>
        <Action disabled={pending} onClick={() => run(letTimePass)}>Wait an hour</Action>
        {me.arrears > 0 ? <Action disabled={pending} onClick={() => run(clearArrears)}>Pay arrears</Action> : null}
      </div>
      <p className="text-xs leading-5 text-[#5d6b62]">The restroom works anywhere and fills Bladder. Waiting an hour just lets time pass.</p>
      <button
        className="text-xs text-[#5d6b62]"
        onClick={() =>
          run(async () => {
            const result = await logout();
            if (result.ok) router.push("/");
            return result;
          })
        }
      >
        Sign out
      </button>
      </div> : null}
    </div>
  );
}

function MapPanel({
  view,
  run,
  pending,
  onOpen,
  sheetRoot,
}: {
  view: GameView;
  run: Run;
  pending: boolean;
  onOpen: (id: string) => void;
  sheetRoot: HTMLDivElement | null;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [chat, setChat] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupReply, setGroupReply] = useState<{ id: string; fromName: string; text: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "nightlife" | "food" | "hotel" | "pickup" | "market" | "school" | "airport" | "health" | "city">("all");
  const [query, setQuery] = useState("");
  const [leftAt, setLeftAt] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "list" | "place" | "courses">(null);
  const [visit, setVisit] = useState(0);
  const [closedVisit, setClosedVisit] = useState(-1);
  const [admission, setAdmission] = useState<null | { school: string; course: string; when: string; fee: number }>(null);
  const [returnToList, setReturnToList] = useState(false);
  const mapFrame = useRef<HTMLDivElement>(null);
  const mapView = useRef({ zoom: 1, x: 0, y: 0 });
  const [mapFrameState, setMapFrame] = useState({ zoom: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const pinchDist = useRef<number | null>(null);
  const skipClick = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const placeId = picked ?? view.me.locationId;
  const place = placeById(placeId);
  const here = placeId === view.me.locationId;
  const options = here ? [] : travelOptions(view.me.locationId, placeId, view.me.hasCar, view.balance);
  const rides = [...options].sort((a, b) => Number(b.mode === "car") - Number(a.mode === "car"));
  const career = view.me.job ? careerById(view.me.job.careerId) : null;
  const canWork = Boolean(career && here && view.me.indoors && career.placeId === place.id);
  const showDoor = here && !view.me.indoors && leftAt !== view.me.locationId;
  const needle = query.trim().toLowerCase();
  const visible = PLACES.filter((item) => {
    const inFilter =
      filter === "all" ||
      (filter === "market" && item.kind === "market") ||
      (filter === "health" && item.kind === "health") ||
      (filter === "city" && (item.kind === "public" || item.kind === "work" || item.kind === "home")) ||
      item.kind === filter;
    if (!inFilter) return false;
    if (!needle) return true;
    return item.name.toLowerCase().includes(needle) || item.area.toLowerCase().includes(needle);
  });
  const pins = visible.some((item) => item.id === place.id) ? visible : [place, ...visible];
  const laid = layoutPins(pins);

  function focusMap(nextZoom: number, clientX: number, clientY: number) {
    const el = mapFrame.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const { zoom, x, y } = mapView.current;
    const z = Math.min(4, Math.max(1, nextZoom));
    const ox = clientX - rect.left - rect.width / 2;
    const oy = clientY - rect.top - rect.height / 2;
    let nx = ox - ((ox - x) / zoom) * z;
    let ny = oy - ((oy - y) / zoom) * z;
    if (z <= 1.01) {
      nx = 0;
      ny = 0;
    } else {
      const limitX = (rect.width * (z - 1)) / 2;
      const limitY = (rect.height * (z - 1)) / 2;
      nx = Math.min(limitX, Math.max(-limitX, nx));
      ny = Math.min(limitY, Math.max(-limitY, ny));
    }
    const next = { zoom: z, x: nx, y: ny };
    mapView.current = next;
    setMapFrame(next);
  }

  useEffect(() => {
    const el = mapFrame.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.16 : 1 / 1.16;
      focusMap(mapView.current.zoom * factor, event.clientX, event.clientY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (!here || (!showDoor && !view.me.indoors)) return;
    panel.current?.closest("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [here, showDoor, view.me.indoors, view.me.locationId]);

  function depart(mode: TravelMode) {
    return run(async () => {
      const result = await go(place.id, mode);
      if (result.ok) {
        setPicked(null);
        setLeftAt(null);
        setSheet(null);
      }
      return result;
    });
  }

  function openPlace(id: string, backToList = false) {
    setPicked(id);
    setReturnToList(backToList);
    setSheet("place");
  }

  function closeSheet() {
    if (sheet === "place" && returnToList) {
      setSheet("list");
      return;
    }
    if (sheet === "courses") {
      setSheet("list");
      return;
    }
    setReturnToList(false);
    setSheet(null);
  }

  const inside = here && view.me.indoors;
  return (
    <div ref={panel} className={inside || showDoor ? "absolute inset-0" : "space-y-4"}>
      {inside ? (
        <VenueInterior
          place={place}
          look={view.me.look}
          pending={pending}
          username={view.me.username}
          people={[
            { id: view.me.id, name: view.me.username, look: view.me.look },
            ...view.nearby.map((person) => ({ id: person.id, name: person.name, look: person.look })),
          ]}
          besideId={view.me.besideId}
          selfId={view.me.id}
          onPickPerson={onOpen}
          onDorime={(amount) => run(() => doDorime(amount))}
          onDrink={() => run(takeDrink)}
          onDance={() => run(hitDanceFloor)}
          onFood={() => run(orderFood)}
          onSpray={(amount) => run(() => spray(amount))}
          onBook={(stay) => run(() => takeRoom(stay))}
          onOffer={(npcId) => run(() => makeOffer(npcId))}
          onOutside={() => run(goOutside)}
          spendable={view.pools.earned + view.pools.gifted}
          room={view.me.room?.placeId === place.id ? view.me.room.stay : null}
          onSleep={() => run(sleepAtHotel)}
          onLeaveRoom={() => run(checkoutRoom)}
          onTreat={() => run(getTreatment)}
          sick={view.me.sick}
          house={
            place.kind === "home" && place.id === homeById(view.me.homeId).areaId
              ? { name: homeById(view.me.homeId).name, owned: view.me.furniture }
              : null
          }
          onBuyFurniture={(itemId) => run(() => buyFurniture(itemId))}
          fill
          extra={place.id === "sam-mbakwe" ? <AirportDesk run={run} pending={pending} /> : null}
          onApply={place.kind === "school" && !view.me.school ? () => setVisit((value) => value + 1) : undefined}
        />
      ) : showDoor ? (
        <div className="flex h-full items-end bg-[#d7ebdd] px-4 pb-28">
          <div className="w-full">
            <ArrivalScene
              placeId={view.me.locationId}
              ride={view.me.lastRide}
              look={view.me.look}
              pending={pending}
              onEnter={() => {
                const entering = placeById(view.me.locationId);
                const already = Boolean(view.me.school);
                run(enterDoor).then((result) => {
                  if (result.ok && entering.kind === "school" && !already) setVisit((value) => value + 1);
                });
              }}
              onLeave={() => setLeftAt(view.me.locationId)}
            />
          </div>
        </div>
      ) : (
      <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["all", "All"],
            ["nightlife", "Nightlife"],
            ["food", "Food"],
            ["hotel", "Hotels"],
            ["pickup", "Pickup"],
            ["market", "Markets"],
            ["school", "Schools"],
            ["health", "Health"],
            ["airport", "Fly"],
            ["city", "City"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setFilter(id);
              setSheet("list");
            }}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${filter === id ? "bg-[#143d2c] text-[#f6f1e6]" : "bg-white"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {here && view.me.indoors ? (
        <VenueInterior
          place={place}
          look={view.me.look}
          pending={pending}
          username={view.me.username}
          people={[
            { id: view.me.id, name: view.me.username, look: view.me.look },
            ...view.nearby.map((person) => ({ id: person.id, name: person.name, look: person.look })),
          ]}
          besideId={view.me.besideId}
          selfId={view.me.id}
          onPickPerson={onOpen}
          onDorime={(amount) => run(() => doDorime(amount))}
          onDrink={() => run(takeDrink)}
          onDance={() => run(hitDanceFloor)}
          onFood={() => run(orderFood)}
          onSpray={(amount) => run(() => spray(amount))}
          onBook={(stay) => run(() => takeRoom(stay))}
          onOffer={(npcId) => run(() => makeOffer(npcId))}
          onOutside={() => run(goOutside)}
          spendable={view.pools.earned + view.pools.gifted}
          room={view.me.room?.placeId === place.id ? view.me.room.stay : null}
          onSleep={() => run(sleepAtHotel)}
          onLeaveRoom={() => run(checkoutRoom)}
          onTreat={() => run(getTreatment)}
          sick={view.me.sick}
          house={
            place.kind === "home" && place.id === homeById(view.me.homeId).areaId
              ? { name: homeById(view.me.homeId).name, owned: view.me.furniture }
              : null
          }
          onBuyFurniture={(itemId) => run(() => buyFurniture(itemId))}
        />
      ) : null}
      {here ? (
        <section className="flex items-center justify-between gap-3 rounded-[1.6rem] bg-white p-3 shadow-sm">
          <div className="min-w-0">
            <h3 className="truncate font-display text-2xl">{place.name}</h3>
            <p className="text-sm font-semibold text-[#1f6b45]">{view.nearby.length} here</p>
          </div>
          <button type="button" onClick={() => setGroupOpen(true)} className="shrink-0 rounded-full bg-[#1f6b45] px-4 py-2 text-sm font-semibold text-[#f6f1e6]">
            Open chat
          </button>
        </section>
      ) : null}
      {here && groupOpen && sheetRoot
        ? createPortal(
            <div className="absolute inset-x-0 bottom-0 top-16 z-20 flex flex-col overflow-hidden bg-[#efe4d2]">
              <div className="flex items-center gap-3 bg-[#143d2c] px-3 py-3 text-[#f6f1e6]">
                <button type="button" className="text-sm font-semibold" onClick={() => setGroupOpen(false)}>Back</button>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{place.name}</span>
                  <span className="block text-xs text-[#d5e4d8]">Everyone here</span>
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                <div className="flex min-h-full flex-col justify-end gap-2">
                  {view.chat.length === 0 ? <p className="text-sm text-[#5d6b62]">No messages yet. What you send shows up for everyone here.</p> : null}
                  {view.chat.map((line) => (
                    <div key={line.id} className={`max-w-[80%] ${line.fromId === view.me.id ? "self-end" : "self-start"}`}>
                      <SwipeMessage
                        mine={line.fromId === view.me.id}
                        onReply={() => setGroupReply({ id: line.id, fromName: line.fromName, text: line.text })}
                        onDelete={() => run(() => deleteVenueLine(line.id))}
                      >
                        <div className={`rounded-2xl px-3 py-2 ${line.fromId === view.me.id ? "rounded-br-sm bg-[#d8f3dc] text-[#143d2c]" : "rounded-bl-sm bg-white"}`}>
                          <p className="text-[10px] font-semibold text-[#5d6b62]">{line.fromName}</p>
                          {line.replyTo ? <Quote from={line.replyTo.fromName} text={line.replyTo.text} /> : null}
                          <p className="text-sm"><MentionText text={line.text} names={view.nearby.map((person) => person.name)} /></p>
                          <p className={`mt-1 text-[10px] text-[#5d6b62] ${line.fromId === view.me.id ? "text-right" : ""}`}>{line.at}</p>
                        </div>
                      </SwipeMessage>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#fffaf2] p-2">
                <p className="px-1 pb-2 text-[10px] text-[#5d6b62]">Swipe left to reply. Swipe right to delete a message you sent.</p>
                {view.nearby.length > 0 ? (
                  <div className="mb-2 flex gap-2 overflow-x-auto">
                    {view.nearby.map((person) => (
                      <button key={person.id} type="button" className="shrink-0 rounded-full bg-[#efe4d2] px-3 py-1 text-xs font-semibold" onClick={() => setChat((current) => `${current}${current.endsWith(" ") || current.length === 0 ? "" : " "}@${person.name} `)}>@{person.name}</button>
                    ))}
                  </div>
                ) : null}
                {groupReply ? <ReplyBar reply={groupReply} onClear={() => setGroupReply(null)} /> : null}
                {mentionQuery(chat) != null ? (
                  <div className="mb-2 flex gap-2 overflow-x-auto">
                    {view.nearby.filter((person) => person.name.toLowerCase().includes((mentionQuery(chat) ?? "").toLowerCase())).map((person) => (
                      <button key={person.id} type="button" className="shrink-0 rounded-full bg-[#efe4d2] px-3 py-1 text-xs font-semibold" onClick={() => setChat((current) => current.replace(/@[^\s@]*$/, `@${person.name} `))}>@{person.name}</button>
                    ))}
                  </div>
                ) : null}
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const text = chat;
                    const reply = groupReply;
                    setChat("");
                    setGroupReply(null);
                    run(() => sayInVenue(text, reply));
                  }}
                >
                  <input value={chat} onChange={(event) => setChat(event.target.value)} className="min-w-0 flex-1 rounded-full border border-[#e4d8c4] bg-white px-3 py-2 text-sm" placeholder="Message the group" />
                  <button className="rounded-full bg-[#1f6b45] px-4 py-2 text-sm font-semibold text-[#f6f1e6]" disabled={pending}>Send</button>
                </form>
              </div>
            </div>,
            sheetRoot,
          )
        : null}
      <div
        ref={mapFrame}
        className="relative h-[calc(100dvh-11rem)] min-h-[28rem] touch-none overflow-hidden rounded-[1.6rem] bg-[#cfe4d4]"
      >
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${mapFrameState.x}px, ${mapFrameState.y}px) scale(${mapFrameState.zoom})` }}
          onPointerDown={(event) => {
            const surface = event.currentTarget;
            pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (pointers.current.size >= 2) {
              const [a, b] = [...pointers.current.values()];
              pinchDist.current = Math.max(12, Math.hypot(a.x - b.x, a.y - b.y));
              drag.current = null;
              surface.setPointerCapture(event.pointerId);
              return;
            }
            if (mapView.current.zoom > 1) {
              drag.current = { x: event.clientX, y: event.clientY, panX: mapView.current.x, panY: mapView.current.y, moved: false };
              surface.setPointerCapture(event.pointerId);
            }
          }}
          onPointerMove={(event) => {
            if (!pointers.current.has(event.pointerId)) return;
            pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (pointers.current.size >= 2 && pinchDist.current) {
              const [a, b] = [...pointers.current.values()];
              const dist = Math.max(12, Math.hypot(a.x - b.x, a.y - b.y));
              const ratio = dist / pinchDist.current;
              pinchDist.current = dist;
              skipClick.current = true;
              focusMap(mapView.current.zoom * ratio, (a.x + b.x) / 2, (a.y + b.y) / 2);
              return;
            }
            if (!drag.current || mapView.current.zoom <= 1) return;
            const dx = event.clientX - drag.current.x;
            const dy = event.clientY - drag.current.y;
            if (Math.hypot(dx, dy) > 5) drag.current.moved = true;
            const el = mapFrame.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const limitX = (rect.width * (mapView.current.zoom - 1)) / 2;
            const limitY = (rect.height * (mapView.current.zoom - 1)) / 2;
            const next = {
              zoom: mapView.current.zoom,
              x: Math.min(limitX, Math.max(-limitX, drag.current.panX + dx)),
              y: Math.min(limitY, Math.max(-limitY, drag.current.panY + dy)),
            };
            mapView.current = next;
            setMapFrame(next);
          }}
          onPointerUp={(event) => {
            if (drag.current?.moved) skipClick.current = true;
            pointers.current.delete(event.pointerId);
            if (pointers.current.size < 2) pinchDist.current = null;
            drag.current = null;
          }}
          onPointerCancel={(event) => {
            pointers.current.delete(event.pointerId);
            pinchDist.current = null;
            drag.current = null;
          }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <rect width="100" height="100" fill="#d7ebdd" />
            <path d="M8 8 C 28 18, 18 36, 34 52 C 48 66, 28 78, 42 98" fill="none" stroke="#8ec4d4" strokeWidth="6" />
            <path d="M6 62 H 94 M 18 20 H 88 M 30 8 V 92 M 55 12 V 90" fill="none" stroke="#c9b48a" strokeWidth="1.1" />
            <text x="10" y="16" fontSize="3.2" fill="#1f6b45">Nworie</text>
          </svg>
          {pins.map((item) => {
            const spot = laid.get(item.id) ?? item;
            const current = item.id === view.me.locationId;
            const selected = item.id === placeId;
            return (
              <button
                key={item.id}
                aria-label={item.name}
                className="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                onClick={() => {
                  if (skipClick.current) {
                    skipClick.current = false;
                    return;
                  }
                  openPlace(item.id);
                }}
              >
                <span className={`ol-block ${item.id === homeById(view.me.homeId).areaId ? "ol-home-pulse ol-block-home" : ""} ${selected ? "ol-block-on" : ""}`} />
                {current ? <PersonFigure look={view.me.look} className="pointer-events-none absolute -top-8 h-8 w-4" /> : null}
                <span className="pointer-events-none absolute top-full mt-0.5 max-w-16 truncate rounded-full bg-white px-1 py-px text-[8px] font-semibold leading-none text-[#17241e] shadow">
                  {item.id === homeById(view.me.homeId).areaId ? "Home" : item.name}
                </span>
              </button>
            );
          })}
        </div>
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button type="button" aria-label="Zoom in" onClick={() => {
            const el = mapFrame.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            focusMap(mapView.current.zoom * 1.35, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }} className="grid h-8 w-8 place-items-center rounded-full bg-[#fffaf2] text-lg font-semibold text-[#143d2c] shadow">+</button>
          <button type="button" aria-label="Zoom out" onClick={() => {
            const el = mapFrame.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            focusMap(mapView.current.zoom / 1.35, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }} className="grid h-8 w-8 place-items-center rounded-full bg-[#fffaf2] text-lg font-semibold text-[#143d2c] shadow">−</button>
        </div>
        <button
          type="button"
          onClick={() => setSheet("place")}
          className="absolute inset-x-3 bottom-3 rounded-2xl bg-[#fffaf2]/95 px-3 py-2.5 text-left shadow-lg"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9782a]">{here ? "You are here" : "Selected"}</p>
          <p className="font-display text-xl leading-tight">{place.name}</p>
          <p className="text-xs text-[#5d6b62]">{place.area} · Open</p>
        </button>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-[11px] text-[#5d6b62]">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#a9782a]" /> Night</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#c4552a]" /> Food</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#5a3d7a]" /> Hotel</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#8c3d55]" /> Pickup</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#1f6b45]" /> Market</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#245c78]" /> City</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#3d6b4f]" /> School</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#3d7ea6]" /> Fly</span>
      </div>
      <section className="space-y-2">
        <label className="block text-sm font-semibold">
          Find a place
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cartel, Mangrove, hotel…"
            className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3 text-sm font-normal"
          />
        </label>
        <div className="space-y-2">
          {visible.length === 0 ? <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#5d6b62]">No place matches that.</p> : null}
          {visible.map((item) => (
            <button
              key={item.id}
              onClick={() => openPlace(item.id, true)}
              className={`flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-left ${item.id === placeId ? "bg-[#143d2c] text-[#f6f1e6]" : "bg-white"}`}
            >
              <span className="min-w-0">
                <span className="block font-semibold leading-snug">{item.name}</span>
                <span className={`mt-0.5 block text-xs ${item.id === placeId ? "text-[#d5e4d8]" : "text-[#5d6b62]"}`}>{item.area}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${item.id === placeId ? "bg-white/15" : "bg-[#efe4d2] text-[#5d6b62]"}`}>{item.tier}</span>
            </button>
          ))}
        </div>
      </section>
      {sheet && sheetRoot
        ? createPortal(
            sheet === "list" ? (
        <SlideSheet
          label="Places"
          title={{ all: "All", nightlife: "Nightlife", food: "Food", hotel: "Hotels", pickup: "Pickup", market: "Markets", school: "Schools", health: "Hospitals", airport: "Fly", city: "City" }[filter]}
          detail={`${visible.length} ${visible.length === 1 ? "place" : "places"}`}
          onClose={closeSheet}
        >
          {filter === "school" ? (
            <button type="button" onClick={() => setSheet("courses")} className="mb-3 w-full rounded-2xl bg-[#143d2c] px-3 py-3 text-left text-sm font-semibold text-[#f6f1e6]">
              All {courseCount()} courses
              <span className="mt-0.5 block text-xs font-normal text-[#d5e4d8]">Fees come off your bank balance</span>
            </button>
          ) : null}
          <div className="grid gap-2">
            {visible.length === 0 ? <p className="text-sm text-[#5d6b62]">Nothing in this category.</p> : null}
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openPlace(item.id, true)}
                className="flex w-full items-start justify-between gap-3 rounded-2xl bg-white px-3 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block font-semibold leading-tight">{item.name}</span>
                  <span className="mt-0.5 block text-xs text-[#5d6b62]">{item.area} · {item.hours}</span>
                </span>
                <span className="shrink-0 rounded-full bg-[#efe4d2] px-2 py-1 text-[10px] font-semibold text-[#5d6b62]">{item.tier}</span>
              </button>
            ))}
          </div>
        </SlideSheet>
            ) : sheet === "courses" ? (
        <SlideSheet label="Schools" title="Courses" detail={`${courseCount()} courses · fees leave your bank balance`} onClose={closeSheet}>
          <CourseCatalogue view={view} run={run} pending={pending} />
        </SlideSheet>
            ) : (
        <SlideSheet
          label={place.tier}
          title={place.name}
          detail={`${place.area} · ${place.hours}${coursesAt(place.id).length ? ` · ${coursesAt(place.id).length} courses` : ""}`}
          onClose={closeSheet}
        >
          <p className="text-sm">{place.summary}</p>
          {place.kind !== "school" && place.activities.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {place.activities.map((activity) => (
                <span key={activity} className="rounded-full bg-[#efe4d2] px-2 py-1 text-[11px] font-semibold text-[#5d6b62]">{activity}</span>
              ))}
            </div>
          ) : null}
          {!here ? (
            <div className="mt-4 grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Go there</p>
              {rides.map((option) => (
                <button
                  key={option.mode}
                  disabled={pending || !option.available || !option.affordable}
                  onClick={() => depart(option.mode as TravelMode)}
                  className={`flex items-center justify-between rounded-2xl px-3 py-3 text-left text-sm disabled:opacity-40 ${option.mode === "car" ? "bg-[#1f6b45] text-[#f6f1e6]" : "border border-[#e4d8c4] bg-white"}`}
                >
                  <span>
                    <span className="font-semibold">{option.label}</span>
                    <span className={`block ${option.mode === "car" ? "text-[#d5e4d8]" : "text-[#5d6b62]"}`}>{option.hours}h{option.reason ? ` · ${option.reason}` : ""}</span>
                  </span>
                  <span className="font-semibold">{option.cost === 0 ? "Free" : naira(option.cost)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 grid gap-2">
              {!view.me.indoors && leftAt === view.me.locationId ? (
                <Action disabled={pending} onClick={() => setLeftAt(null)}>Walk up to the door</Action>
              ) : null}
              {place.id === "mama-nkechi" ? <Action disabled={pending} onClick={() => run(eatBuka)}>Eat · {naira(800)}</Action> : null}
              {place.id === "mangrove-grill" ? <Action disabled={pending} onClick={() => run(eatGrill)}>Eat · {naira(4500)}</Action> : null}
              {["nworie-park", "cartel-lounge", "mama-nkechi", "eke-ukwu", "cartel-beach", "heartland-resort"].includes(place.id) ? (
                <Action disabled={pending} onClick={() => run(socialise)}>
                  Hang out{place.id === "cartel-lounge" ? ` · ${naira(1000)}` : ""}
                </Action>
              ) : null}
              {place.id === "state-cid" && view.me.indoors ? <PoliceDesk view={view} run={run} pending={pending} /> : null}
              {place.id === "sam-mbakwe" && view.me.indoors ? <AirportDesk run={run} pending={pending} /> : null}
              {view.me.indoors && (place.kind === "health" || place.id === "eke-ukwu") ? (
                <Action disabled={pending} onClick={() => run(getTreatment)}>
                  Get treatment · {naira(TREATMENT_FEE[place.id] ?? 8000)}
                </Action>
              ) : null}
              {canWork ? (
                <div className="grid gap-2">
                  <p className="text-sm font-semibold">Work the shift</p>
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      disabled={pending}
                      onClick={() => run(() => doWork(style.id))}
                      className="rounded-2xl border border-[#e4d8c4] bg-white px-3 py-2 text-left text-sm disabled:opacity-40"
                    >
                      <span className="font-semibold">{style.name}</span>
                      <span className="block text-[#5d6b62]">{style.detail}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          {place.kind === "school" && here && view.me.indoors ? (
            <div className="mt-4">
              {view.me.school?.school === place.name ? (
                <CourseCatalogue view={view} run={run} pending={pending} schoolId={place.id} enrolledOnly />
              ) : view.me.school ? (
                <p className="rounded-2xl bg-white px-3 py-3 text-sm text-[#5d6b62]">
                  {view.me.school.status === "admitted"
                    ? `You are already admitted to ${view.me.school.school} to study ${view.me.school.course}. Drop out of that school if you want to apply here. You can still meet people on this campus.`
                    : `You already applied to study ${view.me.school.course} at ${view.me.school.school}. Drop out if you want another school. You can still meet people on this campus.`}
                </p>
              ) : (
                <Action disabled={pending} onClick={() => setVisit((value) => value + 1)}>Apply for admission</Action>
              )}
            </div>
          ) : null}
        </SlideSheet>
            ),
            sheetRoot,
          )
        : null}
      </>
      )}
      {view.me.indoors && !view.me.school && placeById(view.me.locationId).kind === "school" && visit !== closedVisit && sheetRoot
        ? createPortal(
            <SlideSheet label="Admission" title={placeById(view.me.locationId).name} detail="Pick a course. The application fee comes off now, and you are admitted." onClose={() => setClosedVisit(visit)}>
              <CourseCatalogue
                view={view}
                run={run}
                pending={pending}
                schoolId={view.me.locationId}
                onApplied={(course) => {
                  setClosedVisit(visit);
                  setAdmission({
                    school: placeById(view.me.locationId).name,
                    course: course.name,
                    when: lectureLabel(course),
                    fee: course.fee,
                  });
                }}
              />
            </SlideSheet>,
            sheetRoot,
          )
        : null}
      {admission && sheetRoot
        ? createPortal(
            <SlideSheet label="Admission" title="Congratulations" onClose={() => setAdmission(null)}>
              <p className="text-sm leading-6">
                You have been admitted to {admission.school} to study {admission.course}. Lectures hold {admission.when}. Pay the school fees of {naira(admission.fee)} at the school before you sit a class.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#5d6b62]">
                You can visit another campus to meet people. You cannot apply there until you drop out of {admission.school}.
              </p>
              <button type="button" onClick={() => setAdmission(null)} className="mt-4 w-full rounded-full bg-[#1f6b45] py-3 text-sm font-semibold text-[#f6f1e6]">
                Enter the school
              </button>
            </SlideSheet>,
            sheetRoot,
          )
        : null}
    </div>
  );
}

function courseCount() {
  return PLACES.filter((item) => item.kind === "school").reduce((sum, item) => sum + coursesAt(item.id).length, 0);
}

type PhoneApp = "jobs" | "messages" | "bets" | "houses" | "land" | "wallet" | "bus" | "food" | "campus" | "market" | "night" | "club" | "health" | "fly" | "skills" | "settings";

function PhoneDeck({
  view,
  onPick,
}: {
  view: GameView;
  onPick: (app: PhoneApp) => void;
}) {
  const apps: Array<{ name: string; icon: string; tone: string; pick: PhoneApp }> = [
    { name: "Jobs", icon: "💼", tone: "bg-[#143d2c]", pick: "jobs" },
    { name: "Messages", icon: "💬", tone: "bg-[#3d7ea6]", pick: "messages" },
    { name: "Bets", icon: "⚽", tone: "bg-[#1f6b45]", pick: "bets" },
    { name: "Houses", icon: "🏠", tone: "bg-[#a9782a]", pick: "houses" },
    { name: "Plots", icon: "🌿", tone: "bg-[#3d6b4f]", pick: "land" },
    { name: "Wallet", icon: "💰", tone: "bg-[#c48a2a]", pick: "wallet" },
    { name: "Food", icon: "🍲", tone: "bg-[#b5523a]", pick: "food" },
    { name: "Campus", icon: "🎓", tone: "bg-[#5a3d7a]", pick: "campus" },
    { name: "Market", icon: "🛍", tone: "bg-[#8a5a2a]", pick: "market" },
    { name: "Night", icon: "🎶", tone: "bg-[#7a2e1e]", pick: "night" },
    { name: "Club", icon: "🪩", tone: "bg-[#5a3d12]", pick: "club" },
    { name: "Health", icon: "💊", tone: "bg-[#b5523a]", pick: "health" },
    { name: "Fly", icon: "✈", tone: "bg-[#245c78]", pick: "fly" },
    { name: "Skills", icon: "✨", tone: "bg-[#3d6b4f]", pick: "skills" },
    { name: "Bus", icon: "🚌", tone: "bg-[#c4552a]", pick: "bus" },
    { name: "Settings", icon: "⚙", tone: "bg-[#5d6b62]", pick: "settings" },
  ];
  const clock = clockLabel(view.me.day, view.me.hour).split(" ").at(-1);
  return (
    <div className="mx-auto flex h-full w-full max-w-[390px] flex-col overflow-hidden rounded-[2.6rem] border-[12px] border-[#14110e] bg-[#14110e] shadow-2xl">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.7rem] bg-gradient-to-b from-[#12382c] via-[#1f6b45] to-[#e39a45] text-white">
        <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#14110e]" />
        <div className="px-5 pb-3 pt-9 text-center">
          <p className="font-display text-6xl leading-none">{clock}</p>
          <p className="mt-1 text-sm">{weekday(view.me.day)} · Owerri</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
          <div className="grid grid-cols-4 gap-x-2 gap-y-4">
            {apps.map((app) => (
              <button
                key={app.name}
                type="button"
                onClick={() => onPick(app.pick)}
                className="flex flex-col items-center gap-1"
              >
                <span className={`grid h-14 w-14 place-items-center rounded-2xl text-2xl shadow ${app.tone}`}>{app.icon}</span>
                <span className="text-[11px] font-medium">{app.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-center py-2">
        <span className="h-1 w-28 rounded-full bg-white/80" />
      </div>
    </div>
  );
}

function placesFor(app: PhoneApp) {
  if (app === "food") return PLACES.filter((place) => placeActs(place).plate);
  if (app === "campus") return PLACES.filter((place) => place.kind === "school");
  if (app === "market") return PLACES.filter((place) => place.kind === "market");
  if (app === "night") return PLACES.filter((place) => place.kind === "nightlife");
  if (app === "club") return PLACES.filter((place) => place.kind === "nightlife" || place.id === "concord-hotel");
  if (app === "health") return PLACES.filter((place) => place.kind === "health");
  if (app === "fly") return PLACES.filter((place) => place.kind === "airport");
  return [];
}

function PhonePanel({
  view,
  run,
  pending,
  onArrived,
  onOpen,
  onMeet,
}: {
  view: GameView;
  run: Run;
  pending: boolean;
  onArrived: () => void;
  onOpen: (id: string) => void;
  onMeet: (id: string) => void;
}) {
  const me = view.me;
  const [app, setApp] = useState<PhoneApp | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [peer, setPeer] = useState<string | null>(null);
  if (!app) return <PhoneDeck view={view} onPick={setApp} />;
  const titles: Record<PhoneApp, string> = {
    jobs: "Jobs",
    messages: "Messages",
    bets: "Bets",
    houses: "Houses",
    land: "Plots",
    wallet: "Wallet",
    bus: "Bus",
    food: "Food",
    campus: "Campus",
    market: "Market",
    night: "Nightlife",
    club: "Clubs",
    health: "Health",
    fly: "Fly",
    skills: "Skills",
    settings: "Settings",
  };
  function close() {
    if (picked) {
      setPicked(null);
      return;
    }
    if (peer) {
      setPeer(null);
      return;
    }
    setApp(null);
  }
  const farePlace = picked ? placeById(picked) : null;
  const fareRides = farePlace && farePlace.id !== me.locationId ? travelOptions(me.locationId, farePlace.id, me.hasCar, view.balance) : [];
  const fareActs = farePlace ? placeActs(farePlace) : null;
  return (
    <div className="relative mx-auto flex h-full w-full max-w-[390px] flex-col overflow-hidden rounded-[2.6rem] border-[12px] border-[#14110e] bg-[#14110e] text-[#17241e] shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold text-[#f6f1e6]">{titles[app]}</p>
        <button type="button" aria-label="Close" onClick={close} className="grid h-8 w-8 place-items-center rounded-full bg-white text-lg leading-none text-[#17241e]">×</button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#f4efe4] p-3">
      {app === "bus" ? (
        <section className="rounded-3xl bg-white p-4 text-sm leading-6">
          <h2 className="font-display text-2xl">Bus</h2>
          <p className="mt-2 text-[#5d6b62]">Owerri moves by bus, keke, and okada. Open Food, Campus, Market, Night, or Club and the fare is on the next screen. There is no danfo here.</p>
        </section>
      ) : null}
      {app === "messages" ? (
        <div className="h-[32rem]">
          <PeoplePanel view={view} run={run} pending={pending} peerId={peer} onPeer={setPeer} onOpen={onOpen} onMeet={onMeet} />
        </div>
      ) : null}
      {app === "bets" ? <BetsPanel view={view} run={run} pending={pending} /> : null}
      {app === "wallet" ? <LedgerPanel view={view} /> : null}
      {app === "settings" ? (
        <label className="block rounded-3xl bg-white p-4 text-sm">
          Who can see your net worth
          <select
            className="mt-2 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3"
            value={me.netWorthVisibility}
            onChange={(event) => run(() => setWealthPrivacy(event.target.value as typeof me.netWorthVisibility))}
          >
            <option value="friends">Friends only</option>
            <option value="public">Public</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
      ) : null}
      {app === "skills" ? (
        <div className="grid gap-2">
          {(Object.keys(me.skills) as Array<keyof typeof me.skills>).map((skill) => (
            <div key={skill} className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-sm">
              <span className="font-semibold">{skillLabel(skill)}</span>
              <span>{me.skills[skill].toFixed(1)}</span>
            </div>
          ))}
          <p className="px-1 text-xs text-[#5d6b62]">A shift raises the skill for that job. Open Jobs to apply, then ride to the workplace.</p>
        </div>
      ) : null}
      {(["food", "campus", "market", "night", "club", "health", "fly"] as PhoneApp[]).includes(app) ? (
        <div className="grid gap-2">
          {placesFor(app).map((place) => {
            const plate = placeActs(place).plate;
            return (
              <button key={place.id} type="button" onClick={() => setPicked(place.id)} className="rounded-2xl bg-white px-3 py-3 text-left text-sm">
                <span className="block font-semibold">{place.name}</span>
                <span className="text-[#5d6b62]">{place.area}</span>
                {plate ? <span className="mt-1 block font-semibold text-[#1f6b45]">{plate.name} · {naira(plate.cost)}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
      {app === "jobs" ? <><section className="rounded-3xl bg-[#143d2c] p-4 text-[#f6f1e6]">
        <p className="text-xs uppercase tracking-[0.16em] text-[#d5e4d8]">{weekday(me.day)}</p>
        <p className="font-display text-3xl">{naira(view.balance)}</p>
        <p className="mt-2 text-sm text-[#d5e4d8]">In-game naira only. It never converts back to cash, and the server writes every change to the ledger.</p>
        <p className="mt-2 text-xs text-[#d5e4d8]">Earned {naira(view.pools.earned)} · Gifted {naira(view.pools.gifted)} · Purchased {naira(view.pools.purchased)}</p>
      </section>
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Jobs</h2>
          {me.job || me.pendingJob ? (
            <button className="text-sm font-semibold text-[#b5523a]" disabled={pending} onClick={() => run(leaveJob)}>Quit</button>
          ) : null}
        </div>
        <div className="mt-2 grid gap-2">
          {CAREERS.map((career) => (
            <div key={career.id} className="rounded-2xl bg-white px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{career.name}</p>
                  <p className="text-[#5d6b62]">{skillLabel(career.skill)} · {placeById(career.placeId).name}</p>
                  <p className="text-[#5d6b62]">L1 {naira(career.l1)} · L5 {naira(levelPay(5, career.l1, career.l5))}</p>
                </div>
                <button
                  disabled={pending || Boolean(me.job || me.pendingJob)}
                  className="rounded-full bg-[#1f6b45] px-3 py-1 text-xs font-semibold text-[#f6f1e6] disabled:opacity-40"
                  onClick={() => run(() => takeJob(career.id))}
                >
                  {me.job?.careerId === career.id ? "Yours" : me.pendingJob?.careerId === career.id ? "Soon" : "Apply"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section></> : null}
      {app === "houses" ? (
        <div className="grid gap-4">
          <p className="text-sm text-[#5d6b62]">Homes you can move into. Rent is weekly. New Owerri is the big section. Wetheral is the night street, so the rooms on that side are Ikenegbu.</p>
          {["new-owerri", "ikenegbu", "world-bank", "aladinma"].map((areaId) => (
            <section key={areaId}>
              <h2 className="font-display text-2xl">{placeById(areaId).name}</h2>
              <div className="mt-2 grid gap-2">
                {HOMES.filter((home) => home.areaId === areaId).map((home) => (
                  <button
                    key={home.id}
                    disabled={pending || home.id === me.homeId}
                    onClick={() => run(() => changeHome(home.id))}
                    className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-left text-sm disabled:opacity-60"
                  >
                    <span>
                      <span className="block font-semibold">{home.name}</span>
                      <span className="text-[#5d6b62]">{home.tier}{home.id === me.homeId ? " · you live here" : ""}</span>
                    </span>
                    <span className="font-semibold">{naira(home.rent)}/wk</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
      {app === "land" ? <section>
        <h2 className="font-display text-2xl">Land</h2>
        <p className="mt-1 text-sm text-[#5d6b62]">Plots, farmland, and ad boards. Farmland opens as your career level rises. Every Saturday the payment is earned, so it can pay a meet-up.</p>
        {([
          ["land", "Plots"],
          ["farm", "Farmland"],
          ["board", "Ad boards"],
        ] as const).map(([kind, title]) => (
          <div key={kind} className="mt-4">
            <h3 className="font-semibold">{title}</h3>
            <div className="mt-2 grid gap-2">
              {LANDS.filter((plot) => (plot.kind ?? "land") === kind).map((plot) => {
                const owned = me.lands.some((land) => land.id === plot.id);
                const level = me.job?.level ?? 0;
                const locked = (plot.needLevel ?? 0) > level;
                return (
                  <div key={plot.id} className="rounded-2xl bg-white px-3 py-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{plot.name}</p>
                        <p className="text-[#5d6b62]">{plot.area}{plot.needLevel ? ` · level ${plot.needLevel}` : ""}</p>
                        <p className="text-[#5d6b62]">{plot.blurb}</p>
                      </div>
                      <button
                        type="button"
                        disabled={pending || owned || locked}
                        className="shrink-0 rounded-full bg-[#1f6b45] px-3 py-1 text-xs font-semibold text-[#f6f1e6] disabled:opacity-40"
                        onClick={() => run(() => buyPlot(plot.id))}
                      >
                        {owned ? "Yours" : locked ? `Level ${plot.needLevel}` : "Buy"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[#1f6b45]">{owned ? `${naira(plot.rent)} every Saturday` : `${naira(plot.price)} · ${naira(plot.rent)}/wk`}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <label className="mt-4 block text-sm">
          Who can see your net worth
          <select
            className="mt-1 w-full rounded-2xl border border-[#e4d8c4] bg-white px-3 py-3"
            value={me.netWorthVisibility}
            onChange={(event) => run(() => setWealthPrivacy(event.target.value as typeof me.netWorthVisibility))}
          >
            <option value="friends">Friends only</option>
            <option value="public">Public</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
      </section> : null}
      </div>
      {farePlace && fareActs ? (
        <div className="absolute inset-0 z-20 flex items-end bg-black/45 p-3">
          <div className="max-h-[78%] w-full overflow-y-auto rounded-[1.6rem] bg-white p-4 text-[#17241e] shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">{farePlace.area}</p>
                <h2 className="font-display text-2xl leading-none">{farePlace.name}</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setPicked(null)} className="grid h-8 w-8 place-items-center rounded-full bg-[#f4efe4] text-lg leading-none">×</button>
            </div>
            {fareActs.plate ? <p className="mt-3 text-sm font-semibold text-[#1f6b45]">{fareActs.plate.name} · {naira(fareActs.plate.cost)}</p> : null}
            <p className="mt-2 text-sm leading-6 text-[#5d6b62]">{farePlace.summary}</p>
            {farePlace.id === me.locationId ? (
              <div className="mt-4 grid gap-2">
                <p className="text-sm font-semibold text-[#1f6b45]">You are already here.</p>
                {fareActs.plate ? (
                  <button type="button" disabled={pending} onClick={() => run(orderFood)} className="rounded-full bg-[#17241e] py-3 text-sm font-semibold text-white disabled:opacity-40">
                    Order {fareActs.plate.name}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Get there</p>
                {fareRides.map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    disabled={pending || !option.available || !option.affordable}
                    onClick={() => {
                      run(() => go(farePlace.id, option.mode)).then((result) => {
                        if (result.ok) onArrived();
                      });
                    }}
                    className="flex items-center justify-between rounded-2xl border border-[#e4d8c4] px-3 py-3 text-left text-sm disabled:opacity-40"
                  >
                    <span>
                      <span className="block font-semibold">{option.label}</span>
                      <span className="text-[#5d6b62]">{option.hours}h{option.reason ? ` · ${option.reason}` : ""}</span>
                    </span>
                    <span className="font-semibold">{option.cost === 0 ? "Free" : naira(option.cost)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AirportDesk({ run, pending }: { run: Run; pending: boolean }) {
  return (
    <div className="grid gap-2 rounded-2xl bg-[#f4efe4] p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Departures</p>
        <p className="mt-1 text-sm text-[#5d6b62]">The price is the flight and the vacation together. When the days end, you are inside your house. Rent can fall due while you are gone. A lecture you miss is missed. An open police invite still counts.</p>
      </div>
      {TRIPS.map((trip) => (
        <button
          key={trip.id}
          disabled={pending}
          onClick={() => run(() => takeFlight(trip.id))}
          className="rounded-2xl bg-white px-3 py-3 text-left text-sm disabled:opacity-40"
        >
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">{trip.city}</span>
            <span className="font-semibold">{naira(trip.cost)}</span>
          </span>
          <span className="mt-0.5 block text-xs text-[#5d6b62]">{trip.days} {trip.days === 1 ? "day" : "days"} · {trip.blurb}</span>
        </button>
      ))}
    </div>
  );
}

function SlideSheet({
  label,
  title,
  detail,
  onClose,
  children,
}: {
  label: string;
  title: string;
  detail?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20">
      <button type="button" className="ol-dim absolute inset-0 bg-[#0c1a14]/55" aria-label="Close" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="ol-sheet absolute inset-x-0 bottom-0 flex max-h-[88%] flex-col rounded-t-[1.8rem] bg-[#fffaf2] text-[#17241e] shadow-2xl">
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-[#d9cbb6]" />
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a9782a]">{label}</p>
            <h2 className="font-display text-[1.65rem] leading-none">{title}</h2>
            {detail ? <p className="mt-1 text-sm text-[#5d6b62]">{detail}</p> : null}
          </div>
          <button type="button" aria-label="Close sheet" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#efe4d2] text-lg leading-none">×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">{children}</div>
      </div>
    </div>
  );
}

function CourseCatalogue({
  view,
  run,
  pending,
  schoolId,
  enrolledOnly,
  onApplied,
}: {
  view: GameView;
  run: Run;
  pending: boolean;
  schoolId?: string;
  enrolledOnly?: boolean;
  onApplied?: (course: Course) => void;
}) {
  const schools = PLACES.filter((place) => place.kind === "school" && (!schoolId || place.id === schoolId));
  const mine = view.me.school;
  const balance = view.balance;

  return (
    <div className="grid gap-4">
      {enrolledOnly ? null : (
        <div className="rounded-2xl bg-[#143d2c] px-3 py-3 text-[#f6f1e6]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d5e4d8]">Bank balance</p>
          <p className="font-display text-3xl leading-none">{naira(balance)}</p>
          <p className="mt-1 text-xs text-[#d5e4d8]">The application fee comes off now and you are admitted. School fees come off before lectures.</p>
        </div>
      )}
      {schools.map((school) => {
        const offered = coursesAt(school.id);
        const inside = view.me.locationId === school.id && view.me.indoors;
        const enrolledHere = mine?.school === school.name;
        return (
          <section key={school.id} className="grid gap-2">
            {enrolledOnly ? null : (
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">{school.name}</h3>
                <p className="text-xs text-[#5d6b62]">{offered.length} {offered.length === 1 ? "course" : "courses"}</p>
              </div>
            )}
            {enrolledHere && mine ? (
              <div className="rounded-2xl bg-white px-3 py-3 text-sm">
                <p className="font-semibold">{mine.course}</p>
                <p className="text-[#5d6b62]">{mine.status === "admitted" ? "Admitted" : "Application in. Check back after midnight."}</p>
                <p className="text-[#5d6b62]">Lectures {mine.when}</p>
                {mine.status === "admitted" && !mine.feesPaid ? (
                  <button className="mt-2 w-full rounded-full bg-[#143d2c] py-2 text-sm font-semibold text-[#f6f1e6] disabled:opacity-40" disabled={pending || balance < mine.fee} onClick={() => run(payFees)}>
                    Pay school fees · −{naira(mine.fee)} · left {naira(balance - mine.fee)}
                  </button>
                ) : null}
                {mine.status === "admitted" && mine.feesPaid ? (
                  <button className="mt-2 w-full rounded-full bg-[#1f6b45] py-2 text-sm font-semibold text-[#f6f1e6]" disabled={pending} onClick={() => run(sitLecture)}>
                    Sit the lecture
                  </button>
                ) : null}
                <button className="mt-2 text-xs font-semibold text-[#b5523a]" disabled={pending} onClick={() => run(leaveSchool)}>Drop out</button>
              </div>
            ) : null}
            {enrolledOnly ? null : offered.map((course) => {
              const afterApply = balance - course.applyFee;
              const afterFees = afterApply - course.fee;
              const canApply = inside && !mine && afterApply >= 0;
              return (
                <article key={course.id} className="rounded-2xl bg-white px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold leading-tight">{course.name}</p>
                    <p className="shrink-0 text-sm font-semibold">{naira(course.fee)}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#5d6b62]">{lectureLabel(course)} · {skillLabel(course.skill)}</p>
                  <p className="mt-1 text-[11px] text-[#5d6b62]">Apply −{naira(course.applyFee)} now · balance {naira(afterApply)}</p>
                  <p className={`text-[11px] ${afterFees < 0 ? "text-[#b5523a]" : "text-[#1f6b45]"}`}>
                    {afterFees < 0
                      ? `School fees are short by ${naira(-afterFees)}`
                      : `After school fees · ${naira(afterFees)} left`}
                  </p>
                  <button
                    type="button"
                    disabled={pending || (!mine && !canApply)}
                    onClick={() => {
                      run(() => applyForCourse(course.id)).then((result) => {
                        if (result.ok) onApplied?.(course);
                      });
                    }}
                    className="mt-2 w-full rounded-full bg-[#1f6b45] py-1.5 text-xs font-semibold text-[#f6f1e6] disabled:opacity-40"
                  >
                    {mine ? "Apply" : inside ? `Apply · −${naira(course.applyFee)}` : `Enter ${school.name} to apply`}
                  </button>
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

function PoliceDesk({ view, run, pending }: { view: GameView; run: Run; pending: boolean }) {
  const [targetId, setTargetId] = useState(view.city[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [activity, setActivity] = useState("");
  const me = view.me;

  return (
    <div className="grid gap-3 rounded-2xl bg-[#f4efe4] p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">The desk</p>
        <p className="mt-1 text-sm text-[#5d6b62]">No officer is on duty. The system sends the invite and makes the arrest.</p>
      </div>
      {me.custody ? (
        <button className="rounded-full bg-[#7a2e1e] py-2 text-sm font-semibold text-[#f6f1e6]" disabled={pending} onClick={() => run(serveCustody)}>
          Serve the detention · until {me.custody}
        </button>
      ) : null}
      {me.policeInvite ? (
        <button className="rounded-full bg-[#1f6b45] py-2 text-sm font-semibold text-[#f6f1e6]" disabled={pending} onClick={() => run(honourPoliceInvite)}>
          Honour the invite · before {me.policeInvite.deadline}
        </button>
      ) : null}
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = note;
          setNote("");
          run(() => callPolice(targetId, next));
        }}
      >
        <label className="text-xs font-semibold">
          Call the police on a resident
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="mt-1 w-full rounded-xl border border-[#e4d8c4] bg-white px-3 py-2 text-sm font-normal">
            {view.city.length === 0 ? <option value="">No other residents</option> : null}
            {view.city.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        </label>
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did they do?" className="rounded-xl border border-[#e4d8c4] bg-white px-3 py-2 text-sm" />
        <button className="rounded-full bg-[#143d2c] py-2 text-sm font-semibold text-[#f6f1e6]" disabled={pending || !targetId}>Call police</button>
      </form>
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = activity;
          setActivity("");
          run(() => fileActivity(next));
        }}
      >
        <input value={activity} onChange={(event) => setActivity(event.target.value)} placeholder="Report an activity" className="rounded-xl border border-[#e4d8c4] bg-white px-3 py-2 text-sm" />
        <button className="rounded-full border border-[#e4d8c4] bg-white py-2 text-sm font-semibold" disabled={pending}>File the activity</button>
      </form>
    </div>
  );
}

function sideLabel(pick: BetPick, home: string, away: string) {
  if (pick === "1") return home;
  if (pick === "2") return away;
  return "Draw";
}

function BetsPanel({ view, run, pending }: { view: GameView; run: Run; pending: boolean }) {
  const [picks, setPicks] = useState<Record<string, BetPick>>({});
  const [stakeText, setStakeText] = useState("1000");
  const [codeText, setCodeText] = useState("");
  const [loaded, setLoaded] = useState<{ code: string; key: string } | null>(null);
  const [copied, setCopied] = useState("");
  const open = view.slate.filter((game) => !game.result);
  const finished = view.slate.filter((game) => game.result);
  const legs = view.slate.flatMap((game) => {
    const pick = picks[game.id];
    if (!pick || game.result) return [];
    const odds = pick === "1" ? game.homeOdds : pick === "X" ? game.drawOdds : game.awayOdds;
    return [{ fixtureId: game.id, pick, odds, home: game.home, away: game.away }];
  });
  const totalOdds = legs.length ? multiplyOdds(legs.map((leg) => leg.odds)) : 0;
  const stake = Math.round(Number(stakeText.replace(/,/g, "")));
  const ticketKey = legs.map((leg) => `${leg.fixtureId}:${leg.pick}`).sort().join("|");
  const shared = loaded && loaded.key === ticketKey ? loaded.code : "";
  const returns = Number.isFinite(stake) && stake > 0 && totalOdds ? Math.round(stake * totalOdds) : 0;

  function toggle(id: string, pick: BetPick) {
    setPicks((current) => {
      const next = { ...current };
      if (next[id] === pick) delete next[id];
      else next[id] = pick;
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <section className="rounded-[1.6rem] bg-[#143d2c] p-4 text-[#f6f1e6]">
        <p className="text-xs uppercase tracking-[0.16em] text-[#e0b15a]">Football</p>
        <h2 className="font-display text-3xl leading-none">{finished.length ? "Results" : "Coupon"}</h2>
        <p className="mt-2 text-sm text-[#d5e4d8]">Add games. The odds multiply. Type your stake. A booking code lets someone else play the same ticket and win their own stake.</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(open.length ? playGames : newGames)}
          className="mt-3 rounded-full bg-[#e0b15a] px-4 py-2 text-sm font-semibold text-[#1a140c] disabled:opacity-40"
        >
          {open.length ? "Play the games" : "New games"}
        </button>
      </section>

      {finished.length ? (
        <section className="rounded-2xl bg-white px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Full time</p>
          <ul className="mt-2 space-y-2">
            {finished.map((game) => (
              <li key={game.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{game.home} <span className="text-[#5d6b62]">vs</span> {game.away}</span>
                <span className="shrink-0 font-semibold">{game.homeScore ?? 0}–{game.awayScore ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl bg-white px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Bet slip</p>
        {legs.length ? (
          <ul className="mt-2 space-y-1">
            {legs.map((leg) => (
              <li key={leg.fixtureId} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{leg.home} vs {leg.away} · {sideLabel(leg.pick, leg.home, leg.away)}</span>
                <span className="shrink-0 font-semibold">{leg.odds.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#5d6b62]">Tap 1, X, or 2 on a game. More games multiply the odds.</p>
        )}
        <p className="mt-3 text-sm font-semibold">Total odds {totalOdds ? totalOdds.toFixed(2) : "—"}</p>
        <label className="mt-2 block text-xs font-semibold text-[#5d6b62]">
          Stake
          <input
            inputMode="numeric"
            value={stakeText}
            onChange={(event) => setStakeText(event.target.value.replace(/[^\d]/g, ""))}
            className="mt-1 w-full rounded-xl border border-[#e4d8c4] bg-[#f6f1e6] px-3 py-2 text-base font-semibold text-[#17241e]"
          />
        </label>
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {BET_STAKES.map((amount) => (
            <button key={amount} type="button" onClick={() => setStakeText(String(amount))} className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${stake === amount ? "bg-[#143d2c] text-[#f6f1e6]" : "bg-[#efe4d2]"}`}>
              {naira(amount)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm">Possible win {returns ? naira(returns) : "—"}</p>
        <button
          type="button"
          disabled={pending || !legs.length}
          onClick={() => {
            const sent = legs.map((leg) => ({ fixtureId: leg.fixtureId, pick: leg.pick }));
            void run(() => placeSlip(sent, stake, shared)).then((result) => {
              if (result.ok) {
                setPicks({});
                setLoaded(null);
              }
            });
          }}
          className="mt-3 w-full rounded-full bg-[#143d2c] py-2 text-sm font-semibold text-[#f6f1e6] disabled:opacity-40"
        >
          {shared ? `Place bet · code ${shared}` : "Place bet"}
        </button>
      </section>

      <form
        className="grid grid-cols-[1fr_auto] gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void loadBooking(codeText).then((result) => {
            if (!result.ok) {
              void run(async () => result);
              return;
            }
            const next: Record<string, BetPick> = {};
            for (const leg of result.legs) next[leg.fixtureId] = leg.pick;
            const key = result.legs.map((leg) => `${leg.fixtureId}:${leg.pick}`).sort().join("|");
            setPicks(next);
            setLoaded({ code: result.code, key });
            setCodeText(result.code);
          });
        }}
      >
        <input value={codeText} onChange={(event) => setCodeText(event.target.value.toUpperCase())} placeholder="Booking code" className="rounded-xl border border-[#e4d8c4] bg-white px-3 py-2 text-sm uppercase" />
        <button className="rounded-full bg-white px-3 text-sm font-semibold" disabled={pending}>Load</button>
      </form>

      {view.slips.length ? (
        <section className="space-y-2">
          {view.slips.map((slip) => (
            <article key={slip.id} className="rounded-2xl bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-2xl tracking-wide">{slip.code}</p>
                <button
                  type="button"
                  className="rounded-full bg-[#efe4d2] px-3 py-1 text-xs font-semibold"
                  onClick={() => {
                    void navigator.clipboard?.writeText(slip.code);
                    setCopied(slip.code);
                  }}
                >
                  {copied === slip.code ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-[#5d6b62]">Share this code. They stake their own naira on the same games.</p>
              <ul className="mt-2 space-y-1">
                {slip.legs.map((leg) => {
                  const hit = leg.result ? leg.result === leg.pick : null;
                  return (
                    <li key={leg.fixtureId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">{leg.home} vs {leg.away} · {sideLabel(leg.pick, leg.home, leg.away)}</span>
                      <span className={hit === null ? "font-semibold" : hit ? "font-semibold text-[#1f6b45]" : "font-semibold text-[#7a2e1e]"}>
                        {leg.odds.toFixed(2)}{leg.result ? ` · ${leg.result}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-sm font-semibold">
                {slip.status === "won" ? `Won ${naira(slip.payout)}` : slip.status === "lost" ? "Lost" : `${naira(slip.stake)} at ${slip.odds.toFixed(2)} · returns ${naira(Math.round(slip.stake * slip.odds))}`}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {view.slate.map((game) => {
        const sides = [
          ["1", game.home, game.homeOdds],
          ["X", "Draw", game.drawOdds],
          ["2", game.away, game.awayOdds],
        ] as const;
        const outcome = game.result === "1" ? game.home : game.result === "2" ? game.away : "Draw";
        return (
          <article key={game.id} className="rounded-2xl bg-white px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9782a]">{game.league}</p>
            <p className="mt-1 text-sm font-semibold">{game.home} <span className="font-normal text-[#5d6b62]">vs</span> {game.away}</p>
            {game.result ? (
              <p className="mt-2 text-sm font-semibold">{game.homeScore ?? 0}–{game.awayScore ?? 0} · {outcome}</p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {sides.map(([pick, label, odds]) => (
                  <button
                    key={pick}
                    type="button"
                    disabled={pending}
                    onClick={() => toggle(game.id, pick)}
                    className={`rounded-xl px-1 py-2 text-center ${picks[game.id] === pick ? "bg-[#143d2c] text-[#f6f1e6]" : "bg-[#efe4d2]"}`}
                  >
                    <span className="block text-[10px] font-semibold">{pick}</span>
                    <span className="block truncate text-[10px]">{label}</span>
                    <span className="block text-sm font-semibold">{odds.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function PeoplePanel({
  view,
  run,
  pending,
  peerId,
  onPeer,
  onOpen,
  onMeet,
}: {
  view: GameView;
  run: Run;
  pending: boolean;
  peerId: string | null;
  onPeer: (id: string | null) => void;
  onOpen: (id: string) => void;
  onMeet: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const [handle, setHandle] = useState("");
  const [reply, setReply] = useState<{ id: string; fromName: string; text: string } | null>(null);
  const contacts = new Map<string, { id: string; name: string; look: GameView["me"]["look"] | null; preview: string; at: string }>();
  for (const person of [...view.city, ...view.known, ...view.nearby]) {
    contacts.set(person.id, { id: person.id, name: person.name, look: person.look, preview: "", at: "" });
  }
  for (const npc of NPCS) {
    if (!contacts.has(npc.id)) contacts.set(npc.id, { id: npc.id, name: npc.name, look: null, preview: "", at: "" });
  }
  for (const thread of view.threads) {
    const last = thread.lines[thread.lines.length - 1];
    const current = contacts.get(thread.peerId) ?? { id: thread.peerId, name: thread.peerName, look: null, preview: "", at: "" };
    current.name = thread.peerName;
    current.preview = last?.text ?? "";
    current.at = last?.at ?? "";
    contacts.set(thread.peerId, current);
  }
  const rows = [...contacts.values()].sort((a, b) => Number(Boolean(b.preview)) - Number(Boolean(a.preview)) || a.name.localeCompare(b.name));
  const peer = rows.find((row) => row.id === peerId) ?? null;
  const thread = view.threads.find((item) => item.peerId === peerId);

  if (peer) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.4rem] bg-[#efe4d2]">
        <div className="flex items-center gap-2 bg-[#143d2c] px-3 py-3 text-[#f6f1e6]">
          <button type="button" className="text-sm font-semibold" onClick={() => onPeer(null)}>Back</button>
          <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onOpen(peer.id)}>
            <Avatar look={peer.look} name={peer.name} size={36} />
            <span className="truncate font-semibold">{peer.name}</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <div className="flex min-h-full flex-col justify-end gap-2">
          {thread?.lines.map((line) => {
            const mine = line.fromId === view.me.id;
            const fromName = mine ? view.me.username : peer.name;
            return (
              <div key={line.id} className={`max-w-[80%] ${mine ? "self-end" : "self-start"}`}>
                <SwipeMessage
                  mine={mine}
                  onReply={() => setReply({ id: line.id, fromName, text: line.text })}
                  onDelete={() => run(() => deleteDirectLine(line.id))}
                >
                  <div className={`rounded-2xl px-3 py-2 ${mine ? "rounded-br-sm bg-[#d8f3dc] text-[#143d2c]" : "rounded-bl-sm bg-white"}`}>
                    {line.replyTo ? <Quote from={line.replyTo.fromName} text={line.replyTo.text} /> : null}
                    <p className="text-sm"><MentionText text={line.text} names={[peer.name, view.me.username]} /></p>
                    <p className={`mt-1 text-[10px] text-[#5d6b62] ${mine ? "text-right" : ""}`}>{line.at}</p>
                  </div>
                </SwipeMessage>
              </div>
            );
          })}
          </div>
        </div>
        {peer.id === POLICE_ID ? (
          <p className="bg-[#fffaf2] px-3 py-3 text-xs text-[#5d6b62]">The State CID does not take chat. Honour the invite inside the station.</p>
        ) : (
          <div className="bg-[#fffaf2] p-2">
            <p className="px-1 pb-2 text-[10px] text-[#5d6b62]">Swipe left to reply. Swipe right to delete a message you sent.</p>
            {reply ? <ReplyBar reply={reply} onClear={() => setReply(null)} /> : null}
            {mentionQuery(text) != null ? (
              <button type="button" className="mb-2 rounded-full bg-[#efe4d2] px-3 py-1 text-xs font-semibold" onClick={() => setText((current) => current.replace(/@[^\s@]*$/, `@${peer.name} `))}>@{peer.name}</button>
            ) : null}
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const next = text;
                const quoted = reply;
                setText("");
                setReply(null);
                run(() => sendMessage(peer.id, next, quoted));
              }}
            >
              <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Message" className="min-w-0 flex-1 rounded-full border border-[#e4d8c4] bg-white px-3 py-2 text-sm" />
              <button type="button" className="rounded-full border border-[#1f6b45] px-3 py-2 text-sm font-semibold text-[#1f6b45]" disabled={pending} onClick={() => onMeet(peer.id)}>Meet</button>
              <button className="rounded-full bg-[#1f6b45] px-4 py-2 text-sm font-semibold text-[#f6f1e6]" disabled={pending}>Send</button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="font-display text-2xl">Chats</h2>
      <p className="text-sm text-[#5d6b62]">Message anyone in the city. It stays free. A padi request needs their username.</p>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const next = handle;
          setHandle("");
          run(() => sendFriendRequest(next));
        }}
      >
        <input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="Their username" className="min-w-0 flex-1 rounded-full border border-[#e4d8c4] bg-white px-3 py-2 text-sm" />
        <button className="rounded-full bg-[#143d2c] px-3 py-2 text-xs font-semibold text-[#f6f1e6]" disabled={pending}>Request</button>
      </form>
      {view.requests.incoming.map((request) => (
        <div key={request.fromId} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-3 text-sm">
          <span className="font-semibold">{request.username}</span>
          <span className="flex gap-2">
            <button type="button" className="rounded-full bg-[#1f6b45] px-3 py-1 text-xs font-semibold text-[#f6f1e6]" disabled={pending} onClick={() => run(() => acceptFriendRequest(request.fromId))}>Accept</button>
            <button type="button" className="rounded-full border border-[#e4d8c4] px-3 py-1 text-xs font-semibold" disabled={pending} onClick={() => run(() => declineFriendRequest(request.fromId))}>Decline</button>
          </span>
        </div>
      ))}
      {view.requests.outgoing.map((request) => (
        <p key={request.toId} className="rounded-2xl bg-white px-3 py-3 text-sm text-[#5d6b62]">Waiting on {request.username}</p>
      ))}
      {rows.length === 0 ? <p className="text-sm">Nobody else is in the city yet.</p> : null}
      {rows.map((person) => (
        <button key={person.id} className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left" onClick={() => onPeer(person.id)}>
          <Avatar look={person.look} name={person.name} size={42} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate font-semibold">{person.name}</span>
              <span className="shrink-0 text-[10px] text-[#5d6b62]">{person.at}</span>
            </span>
            <span className="block truncate text-xs text-[#5d6b62]">{person.preview || "Tap to message"}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function LedgerPanel({ view }: { view: GameView }) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl">Ledger</h2>
      <p className="text-sm text-[#5d6b62]">Every naira change is a row: who, how much, why, when. Balance is the sum, not a number the browser invents.</p>
      {view.ledger.length === 0 ? <p className="text-sm">No rows yet.</p> : null}
      {view.ledger.map((entry) => (
        <article key={entry.id} className="rounded-2xl bg-white px-3 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <p className="font-semibold">{entry.reason}</p>
            <p className={entry.amount < 0 ? "text-[#b5523a]" : "text-[#1f6b45]"}>
              {entry.amount < 0 ? "−" : "+"}
              {naira(Math.abs(entry.amount))}
            </p>
          </div>
          <p className="text-xs text-[#5d6b62]">{entry.at} · {entry.source}</p>
        </article>
      ))}
    </div>
  );
}

function PersonSheet({
  person,
  view,
  pending,
  run,
  onClose,
  onMessage,
  onMeet,
}: {
  person: PersonCard;
  view: GameView;
  pending: boolean;
  run: Run;
  onClose: () => void;
  onMessage: (id: string) => void;
  onMeet: (id: string) => void;
}) {
  const [report, setReport] = useState("");
  const socialHere = ["nworie-park", "cartel-lounge", "mama-nkechi", "eke-ukwu", "cartel-beach", "heartland-resort"].includes(view.me.locationId);

  return (
    <div className="absolute inset-x-0 bottom-0 top-16 z-10 mx-auto flex w-full flex-col rounded-t-[1.8rem] bg-[#fffaf2] shadow-2xl md:top-24 xl:top-16">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-3">
          <Avatar look={person.look} name={person.name} size={52} />
          <div>
            <h2 className="font-display text-2xl leading-none">{person.name}</h2>
            <p className="mt-1 text-sm text-[#5d6b62]">{person.gender === "female" ? "Female" : person.gender === "male" ? "Male" : person.role} · {person.mood} · {person.relationship}</p>
          </div>
        </div>
        <button className="text-sm font-semibold" onClick={onClose}>Close</button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
        <p>{person.bio}</p>
        <p>Dream: {person.dream}</p>
        <p>Home: {person.home}</p>
        <p>Skills: {person.skills}</p>
        <p>Businesses: none yet</p>
        <p>{person.circle}</p>
        <p>Net worth: {person.netWorth ?? "Hidden"}</p>
        <div className="flex flex-wrap gap-2">
          <Action disabled={pending} onClick={() => onMessage(person.id)}>Message</Action>
          {person.id === POLICE_ID ? null : (
            <Action disabled={pending} onClick={() => onMeet(person.id)}>Meet</Action>
          )}
          {person.friend ? null : person.isNpc ? (
            <Action disabled={pending} onClick={() => run(() => addFriend(person.id))}>Add padi</Action>
          ) : view.requests.incoming.some((request) => request.fromId === person.id) ? (
            <Action disabled={pending} onClick={() => run(() => acceptFriendRequest(person.id))}>Accept request</Action>
          ) : view.requests.outgoing.some((request) => request.toId === person.id) ? (
            <span className="rounded-full bg-[#efe4d2] px-3 py-2 text-xs font-semibold text-[#5d6b62]">Request sent</span>
          ) : (
            <Action disabled={pending} onClick={() => run(() => sendFriendRequest(person.name))}>Send request</Action>
          )}
          {socialHere ? <Action disabled={pending} onClick={() => run(socialise)}>Hang out</Action> : null}
          {person.blocked ? (
            <Action disabled={pending} onClick={() => run(() => unblockPerson(person.id))}>Unblock</Action>
          ) : (
            <Action disabled={pending} onClick={() => run(() => blockPerson(person.id))}>Block</Action>
          )}
        </div>
        {person.isNpc ? null : (
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const note = report;
              setReport("");
              run(() => callPolice(person.id, note));
            }}
          >
            <p className="text-xs text-[#5d6b62]">Call the police. They get a State CID invite. If they do not honour it, the system arrests them.</p>
            <div className="flex gap-2">
              <input value={report} onChange={(event) => setReport(event.target.value)} placeholder="What did they do?" className="min-w-0 flex-1 rounded-full border border-[#e4d8c4] px-3 py-2" />
              <button className="rounded-full border border-[#e4d8c4] px-3 py-2 text-xs font-semibold" disabled={pending}>Call police</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function layoutPins(places: Array<{ id: string; x: number; y: number }>) {
  const laid = places.map((place) => ({ id: place.id, x: place.x, y: place.y }));
  const gap = 7.5;
  for (let pass = 0; pass < 36; pass += 1) {
    for (let i = 0; i < laid.length; i += 1) {
      for (let j = i + 1; j < laid.length; j += 1) {
        let dx = laid[j].x - laid[i].x;
        let dy = laid[j].y - laid[i].y;
        const dist = Math.hypot(dx, dy) || 0.01;
        if (dist >= gap) continue;
        const push = (gap - dist) / 2;
        dx /= dist;
        dy /= dist;
        laid[i].x = Math.min(94, Math.max(6, laid[i].x - dx * push));
        laid[i].y = Math.min(92, Math.max(8, laid[i].y - dy * push));
        laid[j].x = Math.min(94, Math.max(6, laid[j].x + dx * push));
        laid[j].y = Math.min(92, Math.max(8, laid[j].y + dy * push));
      }
    }
  }
  return new Map(laid.map((pin) => [pin.id, pin]));
}

function mentionQuery(value: string) {
  const match = value.match(/(?:^|\s)@([^\s@]*)$/);
  return match ? match[1] : null;
}

function MentionText({ text, names }: { text: string; names: string[] }) {
  const tokens = [...new Set(names.filter(Boolean))].sort((a, b) => b.length - a.length);
  const nodes: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length) {
    const at = rest.indexOf("@");
    if (at < 0) {
      nodes.push(rest);
      break;
    }
    if (at > 0) nodes.push(rest.slice(0, at));
    const after = rest.slice(at + 1);
    const hit = tokens.find((name) => after.toLowerCase().startsWith(name.toLowerCase()));
    if (hit) {
      nodes.push(<span key={key} className="font-semibold text-[#1f6b45]">@{hit}</span>);
      key += 1;
      rest = after.slice(hit.length);
    } else {
      nodes.push("@");
      rest = after;
    }
  }
  return <>{nodes}</>;
}

function Quote({ from, text }: { from: string; text: string }) {
  return (
    <p className="mb-1 border-l-2 border-[#1f6b45] pl-2 text-[11px] leading-4 text-[#5d6b62]">
      <span className="font-semibold text-[#143d2c]">{from}</span> {text}
    </p>
  );
}

function ReplyBar({ reply, onClear }: { reply: { fromName: string; text: string }; onClear: () => void }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-2 rounded-xl bg-[#efe4d2] px-3 py-2 text-xs">
      <p className="min-w-0">
        <span className="font-semibold">Reply to {reply.fromName}</span>
        <span className="mt-0.5 block truncate text-[#5d6b62]">{reply.text}</span>
      </p>
      <button type="button" className="font-semibold" onClick={onClear} aria-label="Cancel reply">×</button>
    </div>
  );
}

function SwipeMessage({
  mine,
  onReply,
  onDelete,
  children,
}: {
  mine: boolean;
  onReply: () => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const locked = useRef(false);
  const shift = useRef(0);

  function finish() {
    if (shift.current <= -56) onReply();
    else if (shift.current >= 56) onDelete();
    origin.current = null;
    locked.current = false;
    shift.current = 0;
    setDx(0);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <span className="absolute inset-y-0 left-2 grid items-center text-[10px] font-semibold text-[#b5523a]">Delete</span>
      <span className="absolute inset-y-0 right-2 grid items-center text-[10px] font-semibold text-[#1f6b45]">Reply</span>
      <div
        className="relative bg-[#efe4d2]"
        aria-label={mine ? "Your message. Swipe left to reply, right to delete." : "Message. Swipe left to reply, right to delete."}
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={(event) => {
          origin.current = { x: event.clientX, y: event.clientY };
          locked.current = false;
        }}
        onPointerMove={(event) => {
          if (!origin.current) return;
          const next = event.clientX - origin.current.x;
          const rise = event.clientY - origin.current.y;
          if (!locked.current) {
            if (Math.abs(next) < 8 && Math.abs(rise) < 8) return;
            if (Math.abs(rise) > Math.abs(next)) {
              origin.current = null;
              return;
            }
            locked.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          const clamped = Math.max(-88, Math.min(88, next));
          shift.current = clamped;
          setDx(clamped);
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        {children}
      </div>
    </div>
  );
}

function Action({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full bg-[#1f6b45] px-3 py-2 text-sm font-semibold text-[#f6f1e6] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
