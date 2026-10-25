<template>
  <div class="flex h-full">
    <div class="p-12 overflow-y-auto flex-1 min-w-0">
      <slot />
    </div>
    <div class="p-12 pl-0">
      <div class="w-64 h-full border-l border-l-neutral-200 pl-6">
        <div class="space-y-3">
          <NuxtLink
            to="/"
            class="block text-3xl text-neutral-500 tracking-tight"
            activeClass="!text-rose-600 font-semibold"
          >
            Home
          </NuxtLink>
          <NuxtLink
            to="/leaderboard"
            class="block text-3xl text-neutral-500 tracking-tight"
            activeClass="!text-rose-600 font-semibold"
          >
            Leaderboard
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
  <NuxtRouteAnnouncer />
</template>
