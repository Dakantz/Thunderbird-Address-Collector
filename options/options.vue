<script setup lang="ts">
/// <reference types="thunderbird-webext-browser" />

import { onMounted, reactive, watch } from 'vue';
import FolderTree from './components/FolderTree.vue';
import { Settings, SettingsManager } from '../utils/util';
import { syncAddressBook, SyncCb } from '../utils/syncer';
const sman = new SettingsManager();
sman.loadConfig();
const ui_state = reactive({
    sman: sman,
    accounts: [] as browser.accounts.MailAccount[],
    addressBooks: [] as browser.addressBooks.AddressBookNode[],
    syncState: null as SyncCb | null,
});

onMounted(() => {
    console.log("Options page mounted");
    browser.accounts.list().then((accounts) => {
        ui_state.accounts = accounts;
    });
    browser.addressBooks.list().then((abs) => {
        ui_state.addressBooks = abs;
    });
});

watch(() => ui_state, async (newState) => {
    if (sman.settings.syncAllFolders) {
        // Clear syncedFolders if syncAllFolders is true
        sman.settings.syncedFolders = [];
    }
    await sman.saveConfig();
}, { deep: true });

function syncNow() {
    console.log("Sync Now clicked");
    syncAddressBook((s) => {
        ui_state.syncState = reactive(s);
    });
}

</script>

<template>
    <div>
        <h1>Address Collector</h1>
        <h2>Intervals</h2>
        <div>
            <label for="sync-interval">Sync Interval (minutes):</label>
            <input type="number" id="sync-interval" v-model.number="ui_state.sman.settings.syncIntervalMinutes"
                min="1" />
        </div>
        <button @click="syncNow">Sync Now!</button>
        <p>{{ ui_state.syncState?.msg }}</p>
        <progress v-if="ui_state.syncState" :value="ui_state.syncState.percentage" max="1"></progress>

        <h2>Address Book</h2>
        <div>
            <label for="address-book-select">Target Address Book:</label>
            <select id="address-book-select" v-model="ui_state.sman.settings.targetAddressBook">
                <option v-for="ab in ui_state.addressBooks" :key="ab.id" :value="ab.id">
                    {{ ab.name }}
                </option>
            </select>
        </div>
        <h2>Message Folders</h2>
        <p>Select the Message Folders to sync.</p>

        <div>
            <label>
                <input type="checkbox" v-model="ui_state.sman.settings.syncAllFolders" />
                All Folders
            </label>
        </div>
        <div v-if="!ui_state.sman.settings.syncAllFolders">
            <label for="folder-select">Select Folders to Sync:</label>
            <div v-for="account in ui_state.accounts" :key="account.id" style="margin-top: 1em;">
                <h3>{{ account.name }}</h3>
                <FolderTree v-for="folder in account.folders" :key="folder.id" :folder="folder"
                    v-model="ui_state.sman.settings.syncedFolders" />
            </div>
        </div>
        <!-- <div v-for="(folder, id) in ui_state.sman.settings.syncedFolders" :key="id">
            Synced Folder: {{ folder.accountId }} / {{ folder.path }}
        </div> -->

        <div> Settings: {{ JSON.stringify(ui_state.sman.settings) }}</div>
    </div>
</template>