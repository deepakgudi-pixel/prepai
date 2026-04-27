import HomePrimaryCta from "@/components/extras/HomePrimaryCta";
import { FEATURES, HOW_IT_WORKS_STEPS } from "@/lib/data";
import { Clock3, Flame, Sparkles, Users } from "lucide-react";
import Image from "next/image";

const featuredRecipe = {
  title: "Tomato Basil Pasta",
  image: "/pics/image-one.jpg",
};

export default function Home() {
  return (
    <div className="pb-12">
      <section className="border-b border-stone-200 bg-white">
        <div className="page-frame grid gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-18">
          <div className="max-w-3xl">
            <p className="eyebrow">
              <Sparkles className="size-3.5" />
              AI pantry planning
            </p>
            <h1 className="display-title mt-6">
              Cleaner weeknight cooking starts with what is already in your kitchen.
            </h1>
            <p className="section-copy mt-6 max-w-xl">
              PrepAI turns pantry ingredients into fast, realistic meal ideas with a
              calmer interface, less friction, and a sharper product feel from the
              first screen onward.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <HomePrimaryCta />
            </div>

          </div>

          <div className="hero-media min-h-[520px]">
            <Image
              src={featuredRecipe.image}
              alt={featuredRecipe.title}
              fill
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            <div className="absolute left-5 right-5 top-5 grid gap-3 md:grid-cols-2">
              <div className="border border-white/15 bg-black/35 p-4 text-white backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-300">
                  Pantry signal
                </p>
                <p className="mt-3 text-3xl font-semibold">98%</p>
                <p className="mt-2 text-sm text-stone-300">
                  ingredient relevance for tonight&apos;s best-fit recipe
                </p>
              </div>
              <div className="border border-white/15 bg-black/35 p-4 text-white backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-300">
                  Decision time
                </p>
                <p className="mt-3 text-3xl font-semibold">12 min</p>
                <p className="mt-2 text-sm text-stone-300">
                  average time from pantry scan to meal choice
                </p>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      Tonight&apos;s spotlight
                    </p>
                    <h2 className="mt-3 font-display text-4xl leading-none text-stone-950">
                      {featuredRecipe.title}
                    </h2>
                  </div>
                  <span className="border border-stone-200 bg-stone-50 px-3 py-2 text-xs uppercase tracking-[0.2em] text-stone-600">
                    Editor pick
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-600">
                  <span className="nav-pill">
                    <Clock3 className="size-4" />
                    25 min
                  </span>
                  <span className="nav-pill">
                    <Users className="size-4" />
                    2 servings
                  </span>
                  <span className="nav-pill">
                    <Flame className="size-4" />
                    low waste
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-frame py-12">
        <div className="grid gap-px border border-stone-200 bg-stone-200 lg:grid-cols-4">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div key={feature.title} className="bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    0{index + 1}
                  </span>
                  <Icon className="size-5 text-stone-500" />
                </div>
                <h3 className="mt-10 font-display text-3xl leading-none text-stone-950">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-stone-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-stone-950 py-16 text-white">
        <div className="page-frame grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow text-stone-400">How it works</p>
            <h2 className="section-title mt-4 text-white">
              Three steps from pantry to plate.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-stone-300">
              The experience is simple on purpose: quick intake, confident
              suggestions, and recipe detail that is actually useful while cooking.
            </p>
          </div>

          <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <div key={item.step} className="bg-stone-950 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  Step {item.step}
                </p>
                <h3 className="mt-10 font-display text-3xl leading-none text-white">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-stone-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
