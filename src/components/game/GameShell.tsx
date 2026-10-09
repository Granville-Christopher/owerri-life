"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { InstallButton } from "@/components/InstallApp";
import { CityWorld } from "@/components/game/CityWorld";
import { ArrivalScene, HouseRoom, VenueInterior } from "@/components/game/scenes";
import { RideScene } from "@/components/game/RideScene";
import { SpacesPanel } from "@/components/game/SpacesPanel";
import { VoiceNoteButton } from "@/components/game/VoiceNote";
import { FlightScene } from "@/components/game/FlightScene";
import {
  acceptFriendRequest,
  addFriend,
  blockPerson,
  changeHome,
  clearArrears,
  doDorime,
  deleteDirectLine,
  declineFriendRequest,
  doWork,
  applyForCourse,
  callPolice,
  checkoutRoom,
  enterDoor,
  fileActivity,
  takeFlight,
  returnFlight,
  getTreatment,
  honourPoliceInvite,
  goOutside,
  hitDanceFloor,
  leaveJob,
  leaveSchool,
  letTimePass,
  beginTopUp,
  buyCar,
  chooseCar,
  sellFurniturePiece,
  buyFurniture,
  moveFurniture,
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
  sendMoney,
  setWealthPrivacy,
  sitDown,
  standUp,
  doFawwwk,
  inviteOver,
  visitHouseOf,
  buyThemFood,
  postToChat,
  talkBeside,
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
import { BET_STAKES, CAREERS, DREAMS, HOMES, LANDS, NPCS, PLACES, TOP_UPS, TRAITS, TREATMENT_FEE, TRIPS, careerById, carById, coursesAt, homeAreaId, homeById, isTripPlace, lectureLabel, placeActs, placeById, placeClosedNotice, tripById, tripFromPlace, type Course } from "@/lib/game/content";
import { photoForVehicle } from "@/components/game/photoVehicles";
import { POLICE_ID, multiplyOdds, travelOptions } from "@/lib/game/engine";
import { clockLabel, dreamProgress, jobTitle, levelPay, moodLabel, naira, skillLabel, skillNeeded, weekday } from "@/lib/game/format";
import type { GameView, PersonCard } from "@/lib/game/queries";
import { NEED_KEYS, type BetPick, type NeedKey, type TravelMode, type WorkStyle } from "@/lib/game/types";

type Run = (
  work: () => Promise<{ ok: true; notice?: string } | { ok: false; error: string }>,
) => Promise<{ ok: true; notice?: string } | { ok: false; error: string }>;

function faceOf(person: PersonCard) {
  return { id: person.id, name: person.name, look: person.look, gender: person.gender, pose: person.pose };
}
type Tab = "home" | "room" | "map" | "phone" | "people" | "bets" | "ledger";

const styles: Array<{ id: WorkStyle; name: string; detail: string }> = [
  { id: "steady", name: "Steady", detail: "Reliable shift." },
  { id: "jaguda", name: "Work like jaguda", detail: "Big performance. Drains energy and fun." },
  { id: "gist", name: "Gist with colleagues", detail: "Social up, lighter output." },
  { id: "oga", name: "Suck up to Oga", detail: "Charisma helps." },
  { id: "easy", name: "Take am easy", detail: "Less pay, less drain." },
  { id: "leave", name: "Leave early", detail: "Half pay, four hours." },
];

function driven(mode: TravelMode) {
  return mode === "bus" || mode === "car" || mode === "cab" || mode === "okada";
}

export function GameShell({ view }: { view: GameView }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(view.me.indoors ? "map" : "home");
  const [ride, setRide] = useState<null | { placeId: string; mode: TravelMode; vehicle: "car" | "bus" | "cab" | "okada"; carId?: string; then: "map" | "home" | "room" }>(null);
  const [flight, setFlight] = useState<null | { tripId: string; city: string; back?: boolean }>(null);
  const [toast, setToast] = useState<{ id: number; text: string; bad: boolean } | null>(null);
  const [homeSheet, setHomeSheet] = useState(false);
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

  function beginRide(placeId: string, mode: TravelMode, then: "map" | "home" | "room") {
    setRide({
      placeId,
      mode,
      vehicle: mode === "bus" ? "bus" : mode === "cab" ? "cab" : mode === "okada" ? "okada" : "car",
      carId: mode === "car" ? view.me.activeCar : undefined,
      then,
    });
  }

  function finishRide() {
    if (!ride) return;
    const plan = ride;
    setRide(null);
    run(() => go(plan.placeId, plan.mode)).then((result) => {
      if (result.ok) {
        setTab(plan.then);
        flash(`You got to ${placeById(plan.placeId).name}.`, false);
      }
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
    if (!view.me.indoors) return;
    const timer = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [router, view.me.indoors, view.me.locationId]);

  const person = [...view.nearby, ...view.known, ...view.city].find((item) => item.id === personId) ?? null;
  const me = view.me;
  const onTrip = isTripPlace(me.locationId);
  const [skyReady, setSkyReady] = useState(false);

  useEffect(() => {
    if (onTrip && (tab === "room" || tab === "home")) setTab("map");
  }, [onTrip, tab]);

  useEffect(() => {
    if (!flight) {
      setSkyReady(false);
      return;
    }
    const id = window.setTimeout(() => setSkyReady(true), 250);
    return () => window.clearTimeout(id);
  }, [flight]);
  const crowd = [...view.calls].reverse().find((call) => call.fromId !== me.id);
  const crowdText = crowd
    ? crowd.kind === "spray"
      ? `${crowd.fromName} sprayed ${naira(crowd.amount)}`
      : `${crowd.fromName} did dorime · ${naira(crowd.amount)}`
    : null;
  const [phone, setPhone] = useState<HTMLDivElement | null>(null);
  const [roomEntry, setRoomEntry] = useState<"look" | "shop">("look");
  const [shopNonce, setShopNonce] = useState(0);
  const [phoneStart, setPhoneStart] = useState<PhoneApp | null>(null);

  useEffect(() => {
    const block = (event: WheelEvent) => {
      if (event.ctrlKey && event.cancelable) event.preventDefault();
    };
    window.addEventListener("wheel", block, { passive: false });
    return () => window.removeEventListener("wheel", block);
  }, []);

  const lowNeeds = useRef(new Set<string>());
  useEffect(() => {
    const tips: Record<NeedKey, string> = {
      hunger: "You are hungry. Go eat.",
      energy: "You are worn out. Sleep at home.",
      hygiene: "You need a wash. Shower at home.",
      bladder: "Your bladder is full. Find a toilet.",
      fun: "You are bored. Go out and do something.",
      social: "You need company. Hang out with someone.",
    };
    const messages: string[] = [];
    for (const key of NEED_KEYS) {
      const low = me.needs[key] <= 30;
      if (low && !lowNeeds.current.has(key)) messages.push(tips[key]);
      if (low) lowNeeds.current.add(key);
      else lowNeeds.current.delete(key);
    }
    if (me.sick !== "none" && !lowNeeds.current.has("sick")) {
      messages.push(me.sick === "severe" ? "You are seriously sick. Go to a hospital." : "You feel sick. A chemist at Eke Ukwu can treat it.");
    }
    if (me.sick === "none") lowNeeds.current.delete("sick");
    else lowNeeds.current.add("sick");
    if (messages.length) flash(messages.join(" "), true);
  }, [me.needs, me.sick]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#d7ebdd] text-[#17241e]">
      <div ref={setPhone} className="relative h-full w-full overflow-hidden">
        {toast ? (
          <p
            key={toast.id}
            className={`ol-toast pointer-events-none absolute inset-x-3 top-16 z-30 rounded-2xl px-3 py-2 text-sm shadow-lg sm:top-[4.5rem] ${toast.bad ? "bg-[#f3d6cc] text-[#7a2e1e]" : "bg-[#e5f2df] text-[#143d2c]"}`}
            onAnimationEnd={() => setToast(null)}
          >
            {toast.text}
          </p>
        ) : crowdText ? (
          <p className="pointer-events-none absolute inset-x-3 top-[4.5rem] z-30 rounded-2xl bg-[#e5f2df] px-3 py-2 text-sm text-[#143d2c] shadow-lg">
            {crowdText}
          </p>
        ) : null}
        <main className={`absolute inset-0 ${!account && (tab === "home" || tab === "room" || tab === "map") ? "overflow-hidden" : !account && tab === "phone" ? "overflow-hidden px-3 pb-24 pt-[4.5rem]" : "overflow-y-auto px-4 pb-28 pt-20"}`}>
          {account ? <AccountPage view={view} pending={pending} run={run} onBack={() => setAccount(false)} /> : null}
          {!account && tab === "home" && !onTrip && !flight ? <HomePanel view={view} run={run} pending={pending} onOpenMap={() => setTab("map")} onOpenRoom={() => { setRoomEntry("look"); setTab("room"); }} onRide={beginRide} /> : null}
          {!account && tab === "room" && !onTrip && !flight ? (
            <HouseRoom
              name={homeById(me.homeId).name}
              look={me.look}
              homeId={me.homeId}
              furniture={me.furniture}
              layout={me.layout}
              beds={homeById(me.homeId).beds}
              upstairs={homeById(me.homeId).upstairs}
              duplex={homeById(me.homeId).id.includes("duplex")}
              cars={me.cars ?? []}
              pending={pending}
              entry={roomEntry}
              shopNonce={shopNonce}
              onHouses={() => {
                setPhoneStart("houses");
                setTab("phone");
              }}
              onSleep={() => run(sleepAtHome)}
              onShower={() => run(showerAtHome)}
              onBuy={(itemId) => run(() => buyFurniture(itemId))}
              onMove={(key, placement) => run(() => moveFurniture(key, placement))} onSell={(key) => run(() => sellFurniturePiece(key))}
              onToilet={() => run(useRestroom)}
              guests={[
                { id: me.id, name: me.username, look: me.look, gender: me.gender, pose: me.pose },
                ...view.city
                  .filter((person) => person.indoors && person.besideId === me.id && person.locationId === homeAreaId(me.homeId))
                  .map(faceOf),
              ]}
              selfId={me.id}
              besideId={me.besideId}
              bubbles={view.bubbles}
              onPickGuest={setPersonId}
              onSit={() => run(sitDown)}
              onStand={() => run(standUp)}
              onFawwwk={(peerId) => run(() => doFawwwk(peerId))}
              pose={me.pose}
              onOutside={() => {
                setTab("home");
                flash(`You stepped outside ${homeById(me.homeId).name}.`, false);
              }}
            />
          ) : null}
          {!account && tab === "map" && !flight ? (
            <MapPanel
              view={view}
              run={run}
              pending={pending}
              onOpen={setPersonId}
              onGoHome={() => {
                const trip = tripFromPlace(me.locationId);
                if (trip) {
                  setFlight({ tripId: trip.id, city: trip.city, back: true });
                  return;
                }
                const home = homeById(me.homeId);
                if (me.locationId === home.areaId) {
                  setRoomEntry("look");
                  setTab("room");
                  return;
                }
                const options = travelOptions(me.locationId, home.areaId, me.hasCar, view.balance);
                const rideOption = options.find((option) => driven(option.mode) && option.available && option.affordable) ?? options.find((option) => option.available && option.affordable);
                if (!rideOption) {
                  setTab("home");
                  return;
                }
                if (driven(rideOption.mode)) {
                  beginRide(home.areaId, rideOption.mode, "home");
                  return;
                }
                run(() => go(home.areaId, rideOption.mode)).then((result) => {
                  if (result.ok) setTab("home");
                });
              }}
              sheetRoot={phone}
              onFly={(tripId) => {
                const trip = tripById(tripId);
                if (trip) setFlight({ tripId: trip.id, city: trip.city });
              }}
              onFlyHome={() => {
                const trip = tripFromPlace(me.locationId);
                if (trip) setFlight({ tripId: trip.id, city: trip.city, back: true });
              }}
            />
          ) : null}
          {!account && tab === "phone" ? (
            <PhonePanel
              view={view}
              start={phoneStart}
              onStarted={() => setPhoneStart(null)}
              run={run}
              pending={pending}
              onArrived={() => setTab("map")}
              onRide={(placeId, mode) => beginRide(placeId, mode, "map")}
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
                onVisit={() => {
                  setChatWith(null);
                  setTab("map");
                }}
              />
            </div>
          ) : null}
          {!account && tab === "ledger" ? <LedgerPanel view={view} /> : null}
        </main>
        <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex items-start justify-between gap-2 px-2 sm:top-3 sm:px-3">
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button type="button" aria-label="Your account" onClick={() => setAccount(true)} className="rounded-full bg-white p-0.5 shadow-lg">
              <Avatar look={me.look} name={me.username} size={28} />
            </button>
            <div className="grid grid-cols-3 gap-0.5 rounded-full bg-white px-2 py-1 shadow-lg">
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
                <span key={label} title={`${label} ${value}`} className="block h-1 w-5 overflow-hidden rounded-full bg-[#efe4d2] sm:h-1.5 sm:w-7">
                  <span className={`block h-full ${color}`} style={{ width: `${value}%` }} />
                </span>
              ))}
            </div>
          </div>
          <div className="pointer-events-auto flex min-w-0 max-w-[58%] items-center gap-1 overflow-x-auto rounded-full bg-white px-2 py-1 text-[10px] shadow-lg sm:max-w-none sm:gap-3 sm:px-4 sm:py-2 sm:text-sm">
            <span className="shrink-0 font-semibold">{clockLabel(me.day, me.hour)}</span>
            <span className="hidden shrink-0 text-[#5d6b62] sm:inline">{moodLabel(me.needs, me.sick)}</span>
            <span className="hidden shrink-0 text-[#5d6b62] md:inline">{view.city.length} online</span>
            <span className="hidden sm:inline"><InstallButton /></span>
            <button type="button" className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#eef6ea] py-0.5 pl-2 pr-0.5 font-semibold sm:gap-1 sm:py-1 sm:pl-3 sm:pr-1" aria-label="Your balance" onClick={() => setTopUpOpen(true)}>
              {naira(view.balance)}
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1f6b45] text-[10px] text-white sm:h-6 sm:w-6 sm:text-sm">+</span>
            </button>
          </div>
        </div>
        <nav className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white p-1.5 text-[11px] font-semibold shadow-xl">
          <button type="button" className={`flex w-16 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 ${!account && (tab === "home" || tab === "map") ? "bg-[#17241e] text-white" : "text-[#5d6b62]"}`} onClick={() => { setAccount(false); setTab(onTrip ? "map" : "home"); }}><span className="text-base leading-none">⌖</span>Map</button>
          <button
            type="button"
            className="flex w-16 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[#5d6b62]"
            onClick={() => {
              setAccount(false);
              if (onTrip) {
                flash("You are on vacation. Fly home to shop your house.", true);
                setTab("map");
                return;
              }
              setRoomEntry("shop");
              setShopNonce((value) => value + 1);
              setTab("room");
            }}
          >
            <span className="text-base leading-none">▣</span>Buy
          </button>
          <button type="button" className={`flex w-16 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 ${!account && tab === "room" ? "bg-[#17241e] text-white" : "text-[#5d6b62]"}`} onClick={() => {
            setAccount(false);
            const trip = tripFromPlace(view.me.locationId);
            if (trip) {
              setFlight({ tripId: trip.id, city: trip.city, back: true });
              return;
            }
            if (view.me.locationId !== homeById(view.me.homeId).areaId) {
              setHomeSheet(true);
              return;
            }
            setRoomEntry("look");
            setTab("room");
          }}><span className="text-base leading-none">⌂</span>Home</button>
          <button type="button" className={`flex w-16 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 ${!account && tab === "phone" ? "bg-[#17241e] text-white" : "text-[#5d6b62]"}`} onClick={() => { setAccount(false); setTab("phone"); }}><span className="text-base leading-none">▢</span>Phone</button>
        </nav>
        {ride ? <RideScene vehicle={ride.vehicle} carId={ride.carId} onArrive={finishRide} /> : null}
        {flight ? (
          skyReady ? (
          <FlightScene
            city={flight.city}
            look={me.look}
            onArrive={() => {
              const plan = flight;
              setFlight(null);
              if (plan.back) {
                run(returnFlight).then((result) => {
                  if (result.ok) {
                    setRoomEntry("look");
                    setTab("room");
                  }
                });
                return;
              }
              run(() => takeFlight(plan.tripId)).then((result) => {
                if (result.ok) setTab("map");
              });
            }}
          />
          ) : (
            <div className="fixed inset-0 z-[300] bg-[#050814]" />
          )
        ) : null}
        {homeSheet && !ride ? (
          <div className="absolute inset-0 z-[60]" onClick={() => setHomeSheet(false)}>
            <div className="absolute inset-x-3 bottom-24 mx-auto max-w-md rounded-[1.6rem] bg-white p-4 text-[#17241e] shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Go home</p>
                  <p className="font-display text-2xl leading-tight">{homeById(me.homeId).name}</p>
                  <p className="mt-1 text-xs text-[#5d6b62]">You are at {placeById(me.locationId).name}. Pick a ride.</p>
                </div>
                <button type="button" aria-label="Close" onClick={() => setHomeSheet(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f4efe4] text-lg leading-none">×</button>
              </div>
              <div className="mt-3 grid gap-2">
                {travelOptions(me.locationId, homeById(me.homeId).areaId, me.hasCar, view.balance).map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    disabled={pending || !option.available || !option.affordable}
                    onClick={() => {
                      const homeArea = homeById(me.homeId).areaId;
                      setHomeSheet(false);
                      if (driven(option.mode)) {
                        beginRide(homeArea, option.mode, "room");
                        return;
                      }
                      run(() => go(homeArea, option.mode)).then((result) => {
                        if (result.ok) {
                          setRoomEntry("look");
                          setTab("room");
                        }
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
            </div>
          </div>
        ) : null}
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
                detail="You pay real naira. Paystack adds a much larger city balance after it confirms. Bigger payments get a better rate. Purchased naira cannot pay a meet-up."
                onClose={() => setTopUpOpen(false)}
              >
                <div className="grid gap-2">
                  {TOP_UPS.map((pack) => (
                    <button
                      key={pack.pay}
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await beginTopUp(pack.pay);
                          if (result.ok) {
                            window.location.assign(result.url);
                            return;
                          }
                          flash(result.error, true);
                        });
                      }}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3 text-left text-sm disabled:opacity-40"
                    >
                      <span>
                        <span className="block font-semibold">Get {naira(pack.credit)}</span>
                        <span className="text-xs text-[#5d6b62]">Pay {naira(pack.pay)} · {Math.round(pack.credit / pack.pay).toLocaleString("en-NG")} in the game per ₦1</span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-[#1f6b45]">Pay {naira(pack.pay)}</span>
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
          <div className="flex justify-between items-center gap-3"><dt className="text-[#5d6b62]">Car</dt><dd className="text-right font-semibold flex items-center justify-end gap-1.5">{me.hasCar ? <><img src={photoForVehicle(me.activeCar)} alt="Car" className="h-5 w-5 rounded-full object-cover border border-[#e0b15a]" /><span>{carById(me.activeCar)?.name ?? "Executive Sedan"}</span></> : <span>No</span>}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-[#5d6b62]">Start</dt><dd className="text-right font-semibold">{me.lottery === "heir" ? "Heir" : "Struggle"}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-[#5d6b62]">{me.traits.map((id) => TRAITS.find((trait) => trait.id === id)?.name).join(" · ")}</p>
      </section>
      <section className="rounded-[1.6rem] bg-[#143d2c] p-4 text-[#f6f1e6]">
        <p className="text-xs uppercase tracking-[0.16em] text-[#d5e4d8]">Balance</p>
        <p className="font-display text-3xl">{naira(view.balance)}</p>
        <p className="mt-2 text-xs text-[#d5e4d8]">Earned {naira(view.pools.earned)} · Gifted {naira(view.pools.gifted)} · Purchased {naira(view.pools.purchased)}</p>
        <p className="mt-2 text-xs text-[#d5e4d8]">Top up with Paystack. ₦500 buys ₦250,000 in the city. Bigger payments get a better rate. Purchased naira cannot pay a meet-up.</p>
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
  onRide,
}: {
  placeId: string;
  view: GameView;
  pending: boolean;
  run: Run;
  onClose: () => void;
  onEntered: () => void;
  onRide: (placeId: string, mode: TravelMode) => void;
}) {
  const place = placeById(placeId);
  const here = place.id === view.me.locationId;
  const rides = here ? [] : travelOptions(view.me.locationId, place.id, view.me.hasCar, view.balance);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="ol-veil ol-dim fixed inset-0 z-[220] flex items-end justify-center p-3 sm:items-center" onClick={onClose}>
      <div className="ol-modal ol-pop max-h-[80vh] w-full max-w-md overflow-y-auto rounded-[1.8rem] px-5 pb-5 pt-4 text-[#17241e]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a9782a]">{place.area}</p>
            <h2 className="mt-1 font-display text-3xl leading-none">{place.name}</h2>
            <p className="mt-1 text-sm text-[#5d6b62]">{placeClosedNotice(place, view.me.hour) ?? place.hours}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-lg leading-none shadow-sm">×</button>
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
            disabled={pending || Boolean(placeClosedNotice(place, view.me.hour))}
            onClick={() => {
              run(enterDoor).then((result) => {
                if (result.ok) {
                  onClose();
                  onEntered();
                }
              });
            }}
            className="mt-4 w-full rounded-full bg-[#1f6b45] py-3 text-sm font-semibold text-[#f6f1e6] shadow-sm disabled:opacity-40"
          >
            {placeClosedNotice(place, view.me.hour) ?? "Go inside"}
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
                  if (driven(option.mode)) {
                    onClose();
                    onRide(place.id, option.mode);
                    return;
                  }
                  run(() => go(place.id, option.mode)).then((result) => {
                    if (!result.ok) return;
                  });
                }}
                className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-left text-sm shadow-sm disabled:opacity-40"
              >
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  <span className="text-[#5d6b62]">{option.hours}h{option.reason ? ` · ${option.reason}` : ""}</span>
                </span>
                <span className="rounded-full bg-[#1f6b45] px-2.5 py-1 text-xs font-semibold text-[#f6f1e6]">{option.cost === 0 ? "Free" : naira(option.cost)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function HomePanel({ view, run, pending, onOpenMap, onOpenRoom, onRide }: { view: GameView; run: Run; pending: boolean; onOpenMap: () => void; onOpenRoom: () => void; onRide: (placeId: string, mode: TravelMode, then: "map" | "home") => void }) {
  const router = useRouter();
  const me = view.me;
  const home = homeById(me.homeId);
  const atHome = me.locationId === home.areaId;
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
        <CityWorld homeAreaId={home.areaId} locationId={me.locationId} onSelect={setPickedPlace} />
        {atHome ? (
          <button
            type="button"
            onClick={onOpenRoom}
            className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#17241e] px-4 py-2 text-sm font-semibold text-white"
          >
            Your room
          </button>
        ) : null}
        <button type="button" onClick={() => setLifeOpen((open) => !open)} className="absolute left-3 top-20 z-10 rounded-full bg-white px-3 py-2 text-xs font-semibold shadow">
          {lifeOpen ? "Hide" : "Your life"}
        </button>
      </section>
      {pickedPlace ? <PlaceTrip placeId={pickedPlace} view={view} pending={pending} run={run} onClose={() => setPickedPlace(null)} onEntered={onOpenMap} onRide={(id, mode) => onRide(id, mode, "map")} /> : null}
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
                onClick={() => {
                  if (driven(option.mode)) onRide(home.areaId, option.mode, "home");
                  else run(() => go(home.areaId, option.mode));
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
  onGoHome,
  sheetRoot,
  onFly,
  onFlyHome,
}: {
  view: GameView;
  run: Run;
  pending: boolean;
  onOpen: (id: string) => void;
  onGoHome: () => void;
  sheetRoot: HTMLDivElement | null;
  onFly: (tripId: string) => void;
  onFlyHome: () => void;
}) {
  const [visit, setVisit] = useState(0);
  const [closedVisit, setClosedVisit] = useState(-1);
  const [admission, setAdmission] = useState<null | { school: string; course: string; when: string; fee: number }>(null);
  const panel = useRef<HTMLDivElement>(null);
  const place = placeById(view.me.locationId);
  const career = view.me.job ? careerById(view.me.job.careerId) : null;
  const canWork = Boolean(career && view.me.indoors && career.placeId === place.id);
  const inside = view.me.indoors;

  useEffect(() => {
    panel.current?.closest("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [inside, view.me.locationId]);

  return (
    <div ref={panel} className="absolute inset-0">
      {inside ? (
        <VenueInterior
          place={place}
          look={view.me.look}
          pending={pending}
          username={view.me.username}
          people={[
            { id: view.me.id, name: view.me.username, look: view.me.look, gender: view.me.gender, pose: view.me.pose },
            ...(view.inside && place.kind === "home" ? view.inside.people : view.nearby).map(faceOf),
          ]}
          besideId={view.me.besideId}
          selfId={view.me.id}
          bubbles={view.bubbles}
          pose={view.me.pose}
          intimacyWith={view.me.intimacyWith}
          onSit={() => run(sitDown)}
          onStand={() => run(standUp)}
          onFawwwk={(peerId) => run(() => doFawwwk(peerId))}
          onTalk={(peerId, text) => run(() => talkBeside(peerId, text))}
          onPickPerson={onOpen}
          onDorime={(amount) => run(() => doDorime(amount))}
          onDrink={() => run(takeDrink)}
          onDance={() => run(hitDanceFloor)}
          onFood={() => run(orderFood)}
          onSpray={(amount) => run(() => spray(amount))}
          onBook={(stay) => run(() => takeRoom(stay))}
          onFlyTrip={onFly}
          onFlyHome={onFlyHome}
          onOffer={(npcId) => run(() => makeOffer(npcId))}
          onOutside={() => run(goOutside)}
          spendable={view.pools.earned + view.pools.gifted}
          room={view.me.room?.placeId === place.id ? view.me.room.stay : null}
          onSleep={() => run(sleepAtHotel)}
          onLeaveRoom={() => run(checkoutRoom)}
          onTreat={() => run(getTreatment)}
          sick={view.me.sick}
          cars={view.me.cars ?? []}
          onBuyCar={(carId) => run(() => buyCar(carId))}
          house={
            view.inside && place.kind === "home" && view.inside.homeId
              ? {
                  name: view.inside.name,
                  homeId: view.inside.homeId,
                  furniture: view.inside.furniture,
                  layout: view.inside.layout,
                  beds: view.inside.beds,
                  upstairs: view.inside.upstairs,
                  duplex: view.inside.duplex,
                }
              : place.kind === "home" && place.id === homeById(view.me.homeId).areaId
              ? {
                  name: homeById(view.me.homeId).name,
                  homeId: view.me.homeId,
                  furniture: view.me.furniture,
                  layout: view.me.layout,
                  beds: homeById(view.me.homeId).beds,
                  upstairs: homeById(view.me.homeId).upstairs,
                  duplex: homeById(view.me.homeId).id.includes("duplex"),
                }
              : null
          }
          onBuyFurniture={(itemId) => run(() => buyFurniture(itemId))}
          onMoveFurniture={(key, placement) => run(() => moveFurniture(key, placement))} onSellFurniture={(key) => run(() => sellFurniturePiece(key))}
          onHomeToilet={() => run(useRestroom)}
          onHomeSleep={() => run(sleepAtHome)}
          onHomeShower={() => run(showerAtHome)}
          fill
          extra={
            place.id === "sam-mbakwe" || place.id === "state-cid" || canWork ? (
            <>
              {place.id === "sam-mbakwe" ? <AirportDesk pending={pending} onFly={onFly} /> : null}
              {place.id === "state-cid" ? <PoliceDesk view={view} run={run} pending={pending} /> : null}
              {canWork ? (
                <div className="grid gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Work the shift</p>
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => doWork(style.id))}
                      className="rounded-2xl border border-[#e4d8c4] bg-white px-3 py-2 text-left text-xs disabled:opacity-40"
                    >
                      <span className="font-semibold text-[#17241e]">{style.name}</span>
                      <span className="block text-[#5d6b62]">{style.detail}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
            ) : null
          }
          onApply={place.kind === "school" && !view.me.school ? () => setVisit((value) => value + 1) : undefined}
          chat={view.chat}
          onSay={(text) => run(() => sayInVenue(text))}
        />
      ) : (
        <ArrivalScene
          placeId={view.me.locationId}
          look={view.me.look}
          pending={pending}
          hour={view.me.hour}
          onEnter={() => {
            const entering = placeById(view.me.locationId);
            const already = Boolean(view.me.school);
            run(enterDoor).then((result) => {
              if (result.ok && entering.kind === "school" && !already) setVisit((value) => value + 1);
            });
          }}
          onLeave={onGoHome}
        />
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

type PhoneApp = "jobs" | "messages" | "bets" | "houses" | "properties" | "land" | "wallet" | "bus" | "food" | "campus" | "market" | "night" | "club" | "health" | "fly" | "skills" | "settings" | "spaces";

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
    { name: "Spaces", icon: "🎙️", tone: "bg-[#245c78]", pick: "spaces" },
    { name: "Bets", icon: "⚽", tone: "bg-[#1f6b45]", pick: "bets" },
    { name: "Houses", icon: "🏠", tone: "bg-[#a9782a]", pick: "houses" },
    { name: "Properties", icon: "🔑", tone: "bg-[#143d2c]", pick: "properties" },
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
    { name: "Busimo", icon: "🚌", tone: "bg-[#c4552a]", pick: "bus" },
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
          <button type="button" onClick={() => onPick("jobs")} className="mb-4 w-full rounded-2xl bg-[#143d2c] px-3 py-3 text-left shadow">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e0b15a]">Apply</p>
            <p className="font-display text-2xl leading-tight">Jobs</p>
            <p className="mt-0.5 text-xs text-white/80">Police, software, IT, and the rest of the board.</p>
          </button>
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
  onRide,
  onOpen,
  onMeet,
  start = null,
  onStarted,
}: {
  view: GameView;
  run: Run;
  pending: boolean;
  onArrived: () => void;
  onRide: (placeId: string, mode: TravelMode) => void;
  onOpen: (id: string) => void;
  onMeet: (id: string) => void;
  start?: PhoneApp | null;
  onStarted?: () => void;
}) {
  const me = view.me;
  const [app, setApp] = useState<PhoneApp | null>(start);
  const [picked, setPicked] = useState<string | null>(null);
  const [peer, setPeer] = useState<string | null>(null);
  useEffect(() => {
    onStarted?.();
  }, [onStarted]);
  if (!app) return <PhoneDeck view={view} onPick={setApp} />;
  const titles: Record<PhoneApp, string> = {
    jobs: "Jobs",
    messages: "Messages",
    spaces: "Spaces",
    bets: "Bets",
    houses: "Houses",
    properties: "Properties",
    land: "Plots",
    wallet: "Wallet",
    bus: "Busimo",
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
          <h2 className="font-display text-2xl">Busimo</h2>
          <p className="mt-2 text-[#5d6b62]">Owerri moves by Busimo, keke, and okada. Open Food, Campus, Market, Night, or Club and the fare is on the next screen. There is no danfo here.</p>
        </section>
      ) : null}
      {app === "messages" ? (
        <div className="h-[32rem]">
              <PeoplePanel view={view} run={run} pending={pending} peerId={peer} onPeer={setPeer} onOpen={onOpen} onMeet={onMeet} onVisit={onArrived} />
        </div>
      ) : null}
      {app === "spaces" ? <SpacesPanel /> : null}
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
                <span className="text-[#5d6b62]">{place.area} · {place.hours}</span>
                {placeClosedNotice(place, me.hour) ? <span className="mt-1 block text-xs font-semibold text-[#b5523a]">{placeClosedNotice(place, me.hour)}</span> : null}
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
        <h2 className="font-display text-2xl">Jobs</h2>
        <div className="mt-2 rounded-[1.6rem] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Current job</p>
          <p className="mt-1 font-display text-2xl leading-tight">{jobTitle(me)}</p>
          {me.job ? (
            <>
              <p className="mt-2 text-sm leading-6 text-[#5d6b62]">
                {placeById(careerById(me.job.careerId).placeId).name} · {naira(levelPay(me.job.level, careerById(me.job.careerId).l1, careerById(me.job.careerId).l5))} a shift
              </p>
              <p className="text-sm text-[#5d6b62]">Performance {Math.round(me.job.performance)}%</p>
            </>
          ) : me.pendingJob ? (
            <p className="mt-2 text-sm leading-6 text-[#5d6b62]">
              Starts day {me.pendingJob.startsOnDay} at {placeById(careerById(me.pendingJob.careerId).placeId).name}.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-[#5d6b62]">No job yet. Apply below.</p>
          )}
          {me.job || me.pendingJob ? (
            <button
              type="button"
              className="mt-3 w-full rounded-full bg-[#7a2e1e] py-3 text-sm font-semibold text-white disabled:opacity-40"
              disabled={pending}
              onClick={() => run(leaveJob)}
            >
              Quit this job
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4">
          {([
            ["Police", ["police"]],
            ["Tech", ["software", "it-support", "phone-tech"]],
            ["Town", ["club-dj", "trading", "banking", "nursing", "chef", "content"]],
          ] as const).map(([heading, ids]) => (
            <section key={heading}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">{heading}</p>
              <div className="mt-2 grid gap-2">
                {ids.map((id) => {
                  const career = CAREERS.find((item) => item.id === id);
                  if (!career) return null;
                  return (
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
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section></> : null}
      {app === "houses" ? (
        <div className="grid gap-4">
          <p className="text-sm text-[#5d6b62]">Houses for sale. Buying one keeps the others. Open Properties to choose where you sleep and to go there.</p>
          {["new-owerri", "ikenegbu", "world-bank", "aladinma"].map((areaId) => (
            <section key={areaId}>
              <h2 className="font-display text-2xl">{placeById(areaId).name}</h2>
              <div className="mt-2 grid gap-2">
                {HOMES.filter((home) => home.areaId === areaId).map((home) => {
                  const owned = me.homes.includes(home.id);
                  const sleeping = home.id === me.homeId;
                  return (
                  <button
                    key={home.id}
                    disabled={pending || sleeping}
                    onClick={() => run(() => changeHome(home.id))}
                    className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-left text-sm disabled:opacity-60"
                  >
                    <span>
                      <span className="block font-semibold">{home.name}</span>
                      <span className="text-[#5d6b62]">
                        {home.beds === 1 ? "1 room" : `${home.beds}-bed`}
                        {home.upstairs ? " · upstairs, stairs inside" : ""}
                        {sleeping ? " · you sleep here" : owned ? " · yours" : ""}
                      </span>
                    </span>
                    <span className="text-right font-semibold">
                      <span className="block">{sleeping ? "Sleeping" : owned ? "Sleep here" : home.price ? naira(home.price) : "Move in"}</span>
                      <span className="block text-xs text-[#5d6b62]">{naira(home.rent)}/wk</span>
                    </span>
                  </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
      {app === "properties" ? (
        <div className="grid gap-4">
          <section>
            <h2 className="font-display text-2xl">Houses</h2>
            <p className="mt-1 text-sm text-[#5d6b62]">Pick the house you sleep in. Every house has a fridge in the kitchen. Go there when you are somewhere else. Saturday rent is only for that house.</p>
            <div className="mt-2 grid gap-2">
              {me.homes.map((id) => {
                const home = HOMES.find((item) => item.id === id);
                if (!home) return null;
                const here = me.locationId === home.areaId;
                const sleeping = me.homeId === home.id;
                return (
                  <div key={home.id} className="rounded-2xl bg-white px-3 py-3 text-sm">
                    <p className="font-semibold">{home.name}</p>
                    <p className="text-[#5d6b62]">{placeById(home.areaId).name} · {home.beds === 1 ? "1 room" : `${home.beds}-bed`}{home.upstairs ? " · upstairs" : ""}</p>
                    <p className="text-[#5d6b62]">{naira(home.rent)}/wk{sleeping ? " · you sleep here" : ""}{here ? " · you are in this area" : ""}</p>
                    <div className="mt-2 flex gap-2">
                      {sleeping ? null : (
                        <button type="button" disabled={pending} onClick={() => run(() => changeHome(home.id))} className="rounded-full bg-[#17241e] px-3 py-1 text-xs font-semibold text-white disabled:opacity-40">Sleep here</button>
                      )}
                      {here ? null : (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            const options = travelOptions(me.locationId, home.areaId, me.hasCar, view.balance);
                            const ride = options.find((option) => driven(option.mode) && option.available && option.affordable) ?? options.find((option) => option.available && option.affordable);
                            if (!ride) return;
                            if (driven(ride.mode)) onRide(home.areaId, ride.mode);
                            else run(() => go(home.areaId, ride.mode)).then((result) => {
                              if (result.ok) onArrived();
                            });
                          }}
                          className="rounded-full bg-[#1f6b45] px-3 py-1 text-xs font-semibold text-[#f6f1e6] disabled:opacity-40"
                        >
                          Go there
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <h2 className="font-display text-2xl">Land</h2>
            {me.lands.length === 0 ? <p className="mt-1 text-sm text-[#5d6b62]">No plots, farms, or boards yet. Buy them under Plots.</p> : (
              <div className="mt-2 grid gap-2">
                {me.lands.map((plot) => (
                  <div key={plot.id} className="rounded-2xl bg-white px-3 py-3 text-sm">
                    <p className="font-semibold">{plot.name}</p>
                    <p className="text-[#5d6b62]">{plot.area} · {naira(plot.rent)} every Saturday</p>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="font-display text-2xl">Cars</h2>
            {(me.cars ?? []).length === 0 ? <p className="mt-1 text-sm text-[#5d6b62]">No car yet. The stand is behind the river bank.</p> : (
              <div className="mt-2 grid gap-2">
                {(me.cars ?? []).map((name, index) => {
                  const deal = carById(name);
                  const driving = me.activeCar === name;
                  return (
                    <div key={`${name}-${index}`} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-3 text-sm">
                      <img src={photoForVehicle(deal?.id ?? name)} alt="" className="h-12 w-[4.5rem] shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{deal?.name ?? name}</p>
                        <p className="text-[#5d6b62]">{deal ? `${deal.category} · ${deal.speed}` : "In your garage."}</p>
                      </div>
                      {driving ? (
                        <span className="shrink-0 rounded-full bg-[#143d2c] px-3 py-1 text-xs font-semibold text-white">Driving</span>
                      ) : (
                        <button type="button" disabled={pending} onClick={() => run(() => chooseCar(name))} className="shrink-0 rounded-full bg-[#f2c14e] px-3 py-1 text-xs font-semibold text-[#17241e] disabled:opacity-40">Drive this</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}
      {app === "land" ? <section>
        <h2 className="font-display text-2xl">Land</h2>
        <p className="mt-1 text-sm text-[#5d6b62]">Plots, farmland, ad boards, and businesses. Start small, then grow into billions and trillions. Farmland opens as your career level rises. Every Saturday the payment is earned, so it can pay a meet-up.</p>
        {([
          ["land", "Plots"],
          ["farm", "Farmland"],
          ["board", "Ad boards"],
          ["business", "Businesses"],
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
        <div className="ol-veil ol-dim absolute inset-0 z-20 flex items-end p-3">
          <div className="ol-modal ol-pop max-h-[78%] w-full overflow-y-auto rounded-[1.8rem] px-4 pb-4 pt-3 text-[#17241e]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a9782a]">{farePlace.area}</p>
                <h2 className="mt-1 font-display text-2xl leading-none">{farePlace.name}</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setPicked(null)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg leading-none shadow-sm">×</button>
            </div>
            {fareActs.plate ? <p className="mt-3 text-sm font-semibold text-[#1f6b45]">{fareActs.plate.name} · {naira(fareActs.plate.cost)}</p> : null}
            <p className="mt-2 text-sm leading-6 text-[#5d6b62]">{farePlace.summary}</p>
            {farePlace.id === me.locationId ? (
              <div className="mt-4 grid gap-2">
                <p className="text-sm font-semibold text-[#1f6b45]">You are already here.</p>
                {fareActs.plate ? (
                  <button type="button" disabled={pending} onClick={() => run(orderFood)} className="rounded-full bg-[#1f6b45] py-3 text-sm font-semibold text-[#f6f1e6] shadow-sm disabled:opacity-40">
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
                      if (driven(option.mode)) {
                        setPicked(null);
                        onRide(farePlace.id, option.mode);
                        return;
                      }
                      run(() => go(farePlace.id, option.mode)).then((result) => {
                        if (result.ok) onArrived();
                      });
                    }}
                    className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-left text-sm shadow-sm disabled:opacity-40"
                  >
                    <span>
                      <span className="block font-semibold">{option.label}</span>
                      <span className="text-[#5d6b62]">{option.hours}h{option.reason ? ` · ${option.reason}` : ""}</span>
                    </span>
                    <span className="rounded-full bg-[#1f6b45] px-2.5 py-1 text-xs font-semibold text-[#f6f1e6]">{option.cost === 0 ? "Free" : naira(option.cost)}</span>
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

function AirportDesk({ pending, onFly }: { pending: boolean; onFly: (tripId: string) => void }) {
  return (
    <div className="grid gap-2 rounded-2xl bg-[#f4efe4] p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a9782a]">Departures</p>
        <p className="mt-1 text-sm text-[#5d6b62]">The price is the flight and the vacation together. You land in that city's hotel. Sit, sleep, then fly home when you are done. Rent can fall due while you are gone. A lecture you miss is missed. An open police invite still counts.</p>
      </div>
      {TRIPS.map((trip) => (
        <button
          key={trip.id}
          disabled={pending}
          onClick={() => onFly(trip.id)}
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
      <button type="button" className="ol-veil ol-dim absolute inset-0" aria-label="Close" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="ol-modal ol-sheet absolute inset-x-0 bottom-0 flex max-h-[88%] flex-col rounded-t-[1.8rem] text-[#17241e]">
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-[#e0b15a]" />
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a9782a]">{label}</p>
            <h2 className="font-display text-[1.65rem] leading-none">{title}</h2>
            {detail ? <p className="mt-1 text-sm text-[#5d6b62]">{detail}</p> : null}
          </div>
          <button type="button" aria-label="Close sheet" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-lg leading-none shadow-sm">×</button>
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
  onVisit,
}: {
  view: GameView;
  run: Run;
  pending: boolean;
  peerId: string | null;
  onPeer: (id: string | null) => void;
  onOpen: (id: string) => void;
  onMeet: (id: string) => void;
  onVisit?: () => void;
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
        <div className="bg-[#143d2c] px-3 py-3 text-[#f6f1e6]">
          <div className="flex items-center gap-2">
            <button type="button" className="text-sm font-semibold" onClick={() => onPeer(null)}>Back</button>
            <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onOpen(peer.id)}>
              <Avatar look={peer.look} name={peer.name} size={36} />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{peer.name}</span>
                <span className="block text-[10px] text-[#d5e4d8]">
                  {view.city.find((person) => person.id === peer.id)?.status
                    ?? view.known.find((person) => person.id === peer.id)?.status
                    ?? view.nearby.find((person) => person.id === peer.id)?.status
                    ?? "Private chat"}
                </span>
              </span>
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#d5e4d8]">Private chat. Only you and {peer.name} can see this.</p>
          {peer.id !== POLICE_ID ? (
            <div className="mt-2 flex flex-wrap gap-1">
              <button type="button" disabled={pending} className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold" onClick={() => onMeet(peer.id)}>Meet</button>
              <button type="button" disabled={pending} className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold" onClick={() => run(() => inviteOver(peer.id))}>Invite over</button>
              <button type="button" disabled={pending} className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold" onClick={() => run(() => visitHouseOf(peer.id)).then((result) => { if (result.ok) onVisit?.(); })}>Visit house</button>
              <button type="button" disabled={pending} className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold" onClick={() => { const amount = Number(window.prompt("How much naira?", "5000")); if (amount) run(() => sendMoney(peer.id, amount)); }}>Send money</button>
              <button type="button" disabled={pending} className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold" onClick={() => run(() => buyThemFood(peer.id))}>Buy food</button>
              <button type="button" disabled={pending} className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold" onClick={() => { const note = window.prompt("Post in this private chat"); if (note) run(() => postToChat(peer.id, note)); }}>Post</button>
              <button type="button" disabled={pending} className="rounded-full bg-[#7a2e1e] px-2 py-1 text-[10px] font-semibold" onClick={() => run(() => blockPerson(peer.id))}>Block</button>
            </div>
          ) : null}
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
                  <div className={`rounded-2xl px-3 py-2 ${line.kind === "money" || line.kind === "food" || line.kind === "invite" ? "bg-[#fff4d6] text-[#5a3d12]" : mine ? "rounded-br-sm bg-[#d8f3dc] text-[#143d2c]" : "rounded-bl-sm bg-white"}`}>
                    {line.replyTo ? <Quote from={line.replyTo.fromName} text={line.replyTo.text} /> : null}
                    {line.kind === "voice" && line.voiceId ? (
                      <audio controls preload="none" src={`/api/voice/${line.voiceId}`} className="h-8 max-w-full" />
                    ) : line.kind === "money" || line.kind === "food" ? (
                      <p className="text-sm font-semibold">{line.text}</p>
                    ) : line.kind === "post" ? (
                      <p className="text-sm"><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a9782a]">Post</span> <MentionText text={line.text} names={[peer.name, view.me.username]} /></p>
                    ) : (
                      <p className="text-sm"><MentionText text={line.text} names={[peer.name, view.me.username]} /></p>
                    )}
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
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const next = text;
                const quoted = reply;
                setText("");
                setReply(null);
                run(() => sendMessage(peer.id, next, quoted));
              }}
            >
              <VoiceNoteButton peerId={peer.id} disabled={pending} />
              <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Message" className="min-w-0 flex-1 rounded-full border border-[#e4d8c4] bg-white px-3 py-2 text-sm" />
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
    <div className="ol-modal absolute inset-x-0 bottom-0 top-16 z-10 mx-auto flex w-full flex-col rounded-t-[1.8rem] md:top-24 xl:top-16">
      <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-[#e0b15a]" />
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="flex items-center gap-3">
          <Avatar look={person.look} name={person.name} size={52} />
          <div>
            <h2 className="font-display text-2xl leading-none">{person.name}</h2>
            <p className="mt-1 text-sm text-[#5d6b62]">{person.gender === "female" ? "Female" : person.gender === "male" ? "Male" : person.role} · {person.mood} · {person.relationship}</p>
            {person.status ? <p className="mt-1 text-xs font-semibold text-[#a9782a]">{person.status}</p> : null}
          </div>
        </div>
        <button type="button" aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-lg leading-none shadow-sm" onClick={onClose}>×</button>
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
          {person.status === "At work" ? <p className="w-full text-xs font-semibold text-[#a9782a]">At work. Chat them, or wait until they clock out.</p> : null}
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
