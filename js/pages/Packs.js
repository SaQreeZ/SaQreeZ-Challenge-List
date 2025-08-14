import { store } from "../main.js";
import { fetchPacks, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";

export default {
    components: { Spinner },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-packs-container">
            <div class="page-packs">
            <div class="packs-container">
                <div class="packs-list">
                    <h1>Packs</h1>
                    <p class="description">Zestawy poziomów do ukończenia. Każdy pack daje 0 punktów, ale zostaje zapisany na Twoim profilu po ukończeniu wszystkich poziomów.</p>
                    <div class="search-container">
                        <input 
                            type="text" 
                            v-model="searchQuery" 
                            placeholder="Szukaj packów..." 
                            class="search-input"
                        >
                    </div>
                    <div class="pack-grid">
                        <div v-for="(pack, i) in filteredPacks" :key="pack.id" class="pack-card" :class="{ 'active': selected === getOriginalIndex(i) }" @click="selected = getOriginalIndex(i)">
                            <h3>{{ pack.name }}</h3>
                            <p class="pack-author">by {{ pack.author }}</p>
                            <p class="pack-description">{{ pack.description }}</p>
                            <div class="pack-stats">
                                <span class="level-count">{{ pack.levels.length }} poziomów</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="pack-details" v-if="selectedPack">
                <div class="pack-info">
                    <h2>{{ selectedPack.name }}</h2>
                    <p class="pack-author">Autor: {{ selectedPack.author }}</p>
                    <p class="pack-description">{{ selectedPack.description }}</p>
                    
                    <h3>Poziomy w packu ({{ selectedPack.levels.length }})</h3>
                    <div class="levels-list">
                        <div v-for="(levelData, index) in selectedPackLevels" :key="levelData.path" class="level-item">
                            <span class="level-number">#{{ levelData.rank }}</span>
                            <span class="level-name">{{ levelData.name }}</span>
                        </div>
                    </div>
                </div>
            </div>
                <div class="errors" v-if="errors.length > 0">
                    <p class="error" v-for="error of errors" :key="error">{{ error }}</p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        packs: [],
        loading: true,
        selected: 0,
        errors: [],
        store,
        levelsList: [],
        levelsData: {},
        searchQuery: ''
    }),
    computed: {
        selectedPack() {
            return this.packs[this.selected];
        },
        filteredPacks() {
            if (!this.searchQuery.trim()) {
                return this.packs;
            }
            
            const query = this.searchQuery.toLowerCase().trim();
            return this.packs.filter((pack) => {
                if (!pack) return false;
                return pack.name.toLowerCase().includes(query) || 
                       pack.description.toLowerCase().includes(query);
            });
        },
        selectedPackLevels() {
            if (!this.selectedPack || !this.levelsList.length) return [];
            
            const levels = this.selectedPack.levels.map(levelPath => {
                const rank = this.levelsList.findIndex(([level]) => level && level.path === levelPath) + 1;
                const levelData = this.levelsData[levelPath];
                
                return {
                    path: levelPath,
                    name: levelData ? levelData.name : levelPath,
                    rank: rank || 999999
                };
            });
            
            // Sortuj od najłatwiejszego do najtrudniejszego (niższy ranking = łatwiejszy)
            return levels.sort((a, b) => a.rank - b.rank).map(level => ({
                ...level,
                rank: level.rank === 999999 ? '?' : level.rank
            }));
        }
    },
    async mounted() {
        try {
            // Ładuj packs i listę poziomów równolegle
            const [packsData, levelsListData] = await Promise.all([
                fetchPacks(),
                fetchList()
            ]);
            
            this.packs = packsData;
            this.levelsList = levelsListData;
            
            // Przygotuj mapę danych poziomów dla szybkiego dostępu
            if (levelsListData) {
                levelsListData.forEach(([level]) => {
                    if (level) {
                        this.levelsData[level.path] = level;
                    }
                });
            }
            
            if (!this.packs || this.packs.length === 0) {
                this.errors.push("Nie udało się załadować packów lub lista jest pusta.");
            }
        } catch (error) {
            this.errors.push("Błąd podczas ładowania packów. Spróbuj ponownie za kilka minut.");
            console.error("Failed to load packs:", error);
        } finally {
            this.loading = false;
        }
    },
    methods: {
        getOriginalIndex(filteredIndex) {
            if (!this.searchQuery.trim()) {
                return filteredIndex;
            }
            
            const query = this.searchQuery.toLowerCase().trim();
            const filteredPack = this.filteredPacks[filteredIndex];
            if (!filteredPack) return filteredIndex;
            
            return this.packs.findIndex((pack) => 
                pack && pack.name === filteredPack.name
            );
        }
    }
};