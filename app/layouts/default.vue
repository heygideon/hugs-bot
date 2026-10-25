<template>
  <div class="flex h-full">
    <div class="min-w-0 flex-1 overflow-y-auto p-12">
      <slot />
    </div>
    <div class="p-12 pl-0">
      <div class="h-full w-64 border-l border-l-neutral-200 pl-6">
        <div class="space-y-3">
          <NuxtLink
            to="/"
            class="block text-3xl tracking-tight text-neutral-500"
            activeClass="!text-rose-600 font-semibold"
          >
            Home
          </NuxtLink>
          <NuxtLink
            to="/leaderboard"
            class="block text-3xl tracking-tight text-neutral-500"
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
