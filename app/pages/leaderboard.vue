<script setup lang="ts">
import { picklist, fallback, parse } from "valibot";

const route = useRoute();
const type = parse(fallback(picklist(["hug"]), "hug"), route.query.type);
const view = parse(
  fallback(picklist(["send", "receive", "return"]), "send"),
  route.query.view,
);

const { data } = useFetch(`/api/leaderboard?type=${type}&view=${view}`);
</script>

<template>
  <h1 class="font-heading text-4xl font-semibold">leaderboard</h1>
  <div class="mt-6 flex gap-2">
    <select
      :value="type"
      class="flex h-10 w-32 items-center rounded-md border border-neutral-200 bg-white px-3 text-lg"
    >
      <option value="hug">hugs</option>
    </select>
    <select
      :value="view"
      class="flex h-10 w-32 items-center rounded-md border border-neutral-200 bg-white px-3 text-lg"
    >
      <option value="send">senders</option>
      <option value="receive">receivers</option>
      <option value="return">returners</option>
    </select>
    <input
      type="text"
      placeholder="to..."
      class="flex h-10 w-64 items-center rounded-md border border-neutral-200 bg-white px-3 text-lg"
    />
  </div>
  <div class="mt-6 border-t border-neutral-200">
    <div
      v-for="(row, idx) of data"
      :key="row.userId"
      class="flex h-14 items-center gap-2.5 border-b border-neutral-200"
    >
      <p class="w-7 text-neutral-500">#{{ idx + 1 }}</p>
      <img
        :src="row.user.avatar"
        width="32"
        height="32"
        class="rounded-full border border-neutral-200"
      />
      <p class="min-w-0 flex-1 truncate text-xl">{{ row.user.displayName }}</p>
      <p class="text-xl font-semibold">{{ row.count }}</p>
    </div>
  </div>
</template>
