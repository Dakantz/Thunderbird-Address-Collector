<script setup lang="ts">
/// <reference types="thunderbird-webext-browser" />

import { SyncedFolder } from '../../utils/util';

const synced_folders = defineModel({
    type: Array as () => SyncedFolder[],
    default: () => [],
});

const props = defineProps({
    folder: {
        type: Object as () => browser.folders.MailFolder,
        required: true,
    }
});


function checkFolder(folder: browser.folders.MailFolder) {
    const index = synced_folders.value.findIndex(sf => sf.path === folder.path && sf.accountId === folder.accountId);
    if (index > -1) {
        // Remove folder and its subfolders
        synced_folders.value.splice(index, 1);
    } else {
        synced_folders.value.push(new SyncedFolder(folder.path, folder.accountId as browser.accounts.MailAccountId));
    }
}
function isFolderSynced(folder: browser.folders.MailFolder): boolean {
    return synced_folders.value.some(sf => sf.path === folder.path && sf.accountId === folder.accountId);
}

</script>

<template>
    <div class="folder-tree">

        <div>
            <input type="checkbox" :checked="isFolderSynced(folder)" @change="checkFolder(folder)" />
            {{ folder.name }}
        </div>
        <ul v-if="folder.subFolders">
            <li v-for="sf in folder.subFolders" :key="sf.id">
                <FolderTree :folder="sf" v-model="synced_folders" />
            </li>
        </ul>
    </div>
</template>


<style scoped>
.folder-tree ul {
    list-style: none;
    padding-left: 20px;
}

.folder-tree label {
    cursor: pointer;
}
</style>