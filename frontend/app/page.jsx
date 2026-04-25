import { getUpcomingRecipe } from "@/actions/mealdb.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FEATURES, HOW_IT_WORKS_STEPS, SITE_STATS } from "@/lib/data";
import {
  ArrowRight,
  Clock3,
  Flame,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const upcomingData = await getUpcomingRecipe();
  const upcoming = upcomingData?.recipe;

  return (
    <div className="space-y-8 pb-12">
      <section className="page-frame pt-4 sm:pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="section-shell px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <Badge className="eyebrow border-0 bg-transparent px-0 py-0 shadow-none">
              <Sparkles className="size-3.5" />
              Site-grade kitchen intelligence
            </Badge>

            <h1 className="display-title mt-6 max-w-4xl">
              The pantry app that looks like a magazine cover and cooks like a chef.
            </h1>

            <p className="section-copy mt-6 max-w-2xl">
              PrepAI turns overlooked ingredients into beautiful, usable dinner ideas.
              Scan what you have, get tailored recipes, and keep your kitchen feeling
              inspired instead of improvised.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard">
                <Button size="xl" variant="primary" className="w-full sm:w-auto">
                  Enter the Kitchen
                  <ArrowRight className="size-5" />
                </Button>
              </Link>
              <Link href="/pantry">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Explore Pantry Flow
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Loved by
                </p>
                <p className="mt-2 text-3xl font-semibold text-stone-950">10k+</p>
                <p className="mt-1 text-sm text-stone-600">home cooks this month</p>
              </div>
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Time saved
                </p>
                <p className="mt-2 text-3xl font-semibold text-stone-950">25 min</p>
                <p className="mt-1 text-sm text-stone-600">average weeknight decision</p>
              </div>
              <div className="stat-card">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Waste cut
                </p>
                <p className="mt-2 text-3xl font-semibold text-stone-950">31%</p>
                <p className="mt-1 text-sm text-stone-600">for active households</p>
              </div>
            </div>
          </div>

          <div className="hero-media min-h-[540px]">
            <Image
              src={upcoming?.strMealThumb || "/pics/image-one.jpg"}
              alt={upcoming?.strMeal || "Featured recipe"}
              fill
              sizes="(max-width: 1024px) 100vw, 44vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <div className="panel-surface bg-white/85 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Tonight&apos;s spotlight
                    </p>
                    <h2 className="mt-2 font-display text-4xl leading-none text-stone-950">
                      {upcoming?.strMeal || "Vegetable tart with herb butter"}
                    </h2>
                  </div>
                  <Badge className="rounded-full bg-emerald-900 px-4 py-2 text-white">
                    98% match
                  </Badge>
                </div>

                <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-600">
                  <span className="nav-pill flex items-center gap-2">
                    <Clock3 className="size-4" />
                    25 min
                  </span>
                  <span className="nav-pill flex items-center gap-2">
                    <Users className="size-4" />2 servings
                  </span>
                  <span className="nav-pill flex items-center gap-2">
                    <Flame className="size-4" />
                    zero-waste favorite
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} className="size-4 fill-current" />
                  ))}
                  <span className="ml-2 text-sm text-stone-600">Rated by tonight&apos;s hungry crowd</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-frame">
        <div className="panel-dark grid gap-4 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 sm:px-8">
          {SITE_STATS.map((stat) => (
            <div key={stat.label} className="border-b border-white/10 pb-4 last:border-b-0 sm:border-b-0 sm:border-r sm:pr-4 last:sm:border-r-0">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                {stat.label}
              </p>
              <p className="mt-3 font-display text-5xl leading-none text-white">
                {stat.val}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-frame">
        <div className="section-shell px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Capabilities</p>
              <h2 className="section-title mt-4">A better-looking workflow for everyday cooking.</h2>
            </div>
            <p className="section-copy">
              Every tool in the product is designed to feel crisp, cinematic, and genuinely useful,
              from scan to save to recipe handoff.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="panel-surface flex flex-col gap-5 p-6 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex size-12 items-center justify-center rounded-full bg-emerald-950 text-white shadow-[0_16px_32px_rgba(20,97,78,0.2)]">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      0{index + 1} / {feature.limit}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-4xl leading-none text-stone-950">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-stone-700">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="page-frame">
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="panel-dark px-6 py-8 sm:px-8">
            <p className="eyebrow border-white/10 bg-white/5 text-stone-200">
              Process
            </p>
            <h2 className="section-title mt-4 text-white">From ingredients to plated dinner in three moves.</h2>
            <p className="mt-4 max-w-md text-base leading-7 text-stone-300">
              The flow stays lightweight, but it never feels bare. That’s the whole point:
              utility with presence.
            </p>
          </div>

          <div className="section-shell grid gap-4 px-6 py-6 sm:px-8 sm:py-8 md:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <div key={item.step} className="panel-surface p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Step {item.step}
                </p>
                <h3 className="mt-4 font-display text-4xl leading-none text-stone-950">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-stone-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
