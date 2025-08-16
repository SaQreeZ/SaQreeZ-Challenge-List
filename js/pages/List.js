import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList, fetchPacks } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <div class="search-container">
                    <input 
                        type="text" 
                        v-model="searchQuery" 
                        placeholder="Szukaj poziomów..." 
                        class="search-input"
                    >
                </div>
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in filteredList" :key="i">
                        <td class="rank">
                            <p v-if="getOriginalIndex(i) + 1 <= 100" class="type-label-lg">#{{ getOriginalIndex(i) + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = getOriginalIndex(i)">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>

                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    
                    <!-- Pack Information -->
                    <div v-if="levelPacks.length > 0" class="level-packs">
                        <div class="type-title-sm">Part of Packs</div>
                        <div class="packs-list">
                            <span v-for="pack in levelPacks" :key="pack.id" class="pack-badge">{{ pack.name }}</span>
                        </div>
                    </div>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>

                    </ul>

                    <div class="stats">
                    <li>
                        <div class="type-title-sm">Enjoyment</div>
                        <p>{{ level.enjoyment || 'No rating provided.' }}</p>
                    </li>
                    <li>
                        <div class="type-title-sm">Description</div>
                        <p>
                            {{ level.description || 'No description provided.' }}
                        </p>
                    </li>

                    </div>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 50"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected +1 <= 100"><strong>{{ level.percentToQualify}}%</strong> or better to qualify</p>
                    <p v-else><strong>100%</strong> to qualify (no points)</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}fps</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a>, and modified by SaQreeZ.</p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>
                        Level length MUST be 3 to 69 seconds long.
                    </p>
                    <p>
                        Achieved the record without using hacks (however, FPS bypass is allowed, up to 600fps. CBF is ALLOWED.).
                    </p>
                    <p>
                        Achieved the record on the level that is listed on the site - please check the level ID before you submit a record.
                    </p>
                    <p>
                        I would apprieciate any form of evidence that you have completed or verified the level, such as discord stream or video.
                    </p>
                    <p>
                        Videos of levels will be later posted through my youtube.
                    </p>
                    <p>
                        Any levels abusing physics or bugs too much, or making you MUST turn on cheats, will be removed.
                    </p>
                    <p>
                        Do not use secret routes or bug routes.
                    </p>
                    <p>
                        Do not use easy modes, only completion of an original level counts.
                    </p>
                    <p>
                        Once a level falls onto the Legacy List, we still accept records although, you won't get any points.
                    </p>
                    <p>
                        You can submit the level even if its to easy to be in the main list.
                    </p>
                    <p>
                        No copying levels (Needs SaQreeZ's "Yes").
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        packs: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,
        searchQuery: ''
    }),
    computed: {
        level() {
            return this.list[this.selected][0];
        },
        filteredList() {
            if (!this.searchQuery.trim()) {
                return this.list;
            }
            
            const query = this.searchQuery.toLowerCase().trim();
            return this.list.filter((item) => {
                const [level] = item;
                if (!level) return false;
                return level.name.toLowerCase().includes(query);
            });
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        levelPacks() {
            if (!this.level || !this.packs.length) return [];
            
            return this.packs.filter(pack => 
                pack.levels.includes(this.level.path)
            );
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();
        this.packs = await fetchPacks();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
        getOriginalIndex(filteredIndex) {
            if (!this.searchQuery.trim()) {
                return filteredIndex;
            }
            
            const query = this.searchQuery.toLowerCase().trim();
            let currentFilteredIndex = 0;
            
            for (let i = 0; i < this.list.length; i++) {
                const [level] = this.list[i];
                if (level && level.name.toLowerCase().includes(query)) {
                    if (currentFilteredIndex === filteredIndex) {
                        return i;
                    }
                    currentFilteredIndex++;
                }
            }
            return filteredIndex;
        },
    },
};
