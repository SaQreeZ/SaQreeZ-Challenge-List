import { store } from "../main.js";
import { fetchPacks, fetchList, fetchLeaderboard } from "../content.js";
import { score, round } from "../score.js";

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
                    <p class="description">Zestawy poziomów do ukończenia. Każdy pack daje punkty równe sumie punktów wszystkich poziomów podzielonej przez 2.</p>
                    <div class="search-container">
                        <input 
                            type="text" 
                            v-model="searchQuery" 
                            placeholder="Szukaj packów..." 
                            class="search-input"
                        >
                        <select v-model="sortOption" class="sort-select">
                            <option value="none">Bez sortowania</option>
                            <option value="points">Sortuj według punktów</option>
                        </select>
                    </div>
                    <div class="pack-grid">
                        <div v-for="(pack, i) in filteredPacks" :key="pack.id" class="pack-card" :class="{ 'active': selected === getOriginalIndex(i) }" @click="selected = getOriginalIndex(i)">
                            <h3>{{ pack.name }}</h3>
                            <p class="pack-author">by {{ pack.author }}</p>
                            <p class="pack-description">{{ pack.description }}</p>
                            <div class="pack-stats">
                                <span class="level-count">{{ pack.levels.length }} poziomów</span>
                                <span class="pack-points">{{ calculatePackPoints(pack) }} punktów</span>
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
                    <p class="pack-points"><strong>Punkty za ukończenie: {{ selectedPackPoints }}</strong></p>
                    
                    <h3>Poziomy w packu ({{ selectedPack.levels.length }})</h3>
                    <div class="levels-list">
                        <div v-for="(levelData, index) in selectedPackLevels" :key="levelData.path" class="level-item">
                            <span class="level-number">#{{ levelData.rank }}</span>
                            <span class="level-name">{{ levelData.name }}</span>
                        </div>
                    </div>
                    
                    <h3 v-if="packCompletedBy.length > 0">Ukończone przez ({{ packCompletedBy.length }})</h3>
                    <div v-if="packCompletedBy.length > 0" class="completed-users">
                        <div v-for="user in packCompletedBy" :key="user" class="user-badge">
                            <span>{{ user }}</span>
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
        searchQuery: '',
        leaderboard: [],
        sortOption: 'none'
    }),
    computed: {
        sortedPacks() {
            if (this.sortOption === 'points') {
                return [...this.packs].sort((a, b) => {
                    const pointsA = this.calculatePackPoints(a);
                    const pointsB = this.calculatePackPoints(b);
                    return pointsB - pointsA; // Sortowanie malejące
                });
            }
            return this.packs; // Oryginalna kolejność
        },
        selectedPack() {
            return this.sortedPacks[this.selected];
        },
        filteredPacks() {
            if (!this.searchQuery.trim()) {
                return this.sortedPacks;
            }
            
            const query = this.searchQuery.toLowerCase().trim();
            return this.sortedPacks.filter((pack) => {
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
        },
        packCompletedBy() {
            if (!this.selectedPack || !this.leaderboard.length) return [];
            
            const completedUsers = [];
            this.leaderboard.forEach(user => {
                const userCompletedPack = user.packs.some(pack => pack.name === this.selectedPack.name);
                if (userCompletedPack) {
                    completedUsers.push(user.user);
                }
            });
            
            return completedUsers.sort();
        },
        selectedPackPoints() {
            if (!this.selectedPack || !this.levelsList.length) return 0;
            
            let totalPoints = 0;
            this.selectedPack.levels.forEach(levelPath => {
                const levelIndex = this.levelsList.findIndex(([level]) => level && level.path === levelPath);
                if (levelIndex !== -1) {
                    const [level] = this.levelsList[levelIndex];
                    if (level) {
                        const levelScore = score(levelIndex + 1, 100, level.percentToQualify);
                        totalPoints += levelScore;
                    }
                }
            });
            
            return round(totalPoints / 2);
        }
    },
    async mounted() {
        try {
            // Ładuj packs, listę poziomów i leaderboard równolegle
            const [packsData, levelsListData, leaderboardData] = await Promise.all([
                fetchPacks(),
                fetchList(),
                fetchLeaderboard()
            ]);
            
            this.packs = packsData;
            this.levelsList = levelsListData;
            this.leaderboard = leaderboardData[0]; // fetchLeaderboard zwraca [users, errors]
            
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
        calculatePackPoints(pack) {
            if (!pack || !this.levelsList.length) return 0;
            
            let totalPoints = 0;
            pack.levels.forEach(levelPath => {
                const levelIndex = this.levelsList.findIndex(([level]) => level && level.path === levelPath);
                if (levelIndex !== -1) {
                    const [level] = this.levelsList[levelIndex];
                    if (level) {
                        const levelScore = score(levelIndex + 1, 100, level.percentToQualify);
                        totalPoints += levelScore;
                    }
                }
            });
            
            return round(totalPoints / 2);
        },
        getOriginalIndex(filteredIndex) {
            if (!this.searchQuery.trim()) {
                return filteredIndex;
            }
            
            const query = this.searchQuery.toLowerCase().trim();
            const filteredPack = this.filteredPacks[filteredIndex];
            if (!filteredPack) return filteredIndex;
            
            return this.sortedPacks.findIndex((pack) => 
                pack && pack.name === filteredPack.name
            );
        }
    }
};