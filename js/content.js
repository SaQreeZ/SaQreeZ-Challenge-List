import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    const packs = await fetchPacks();

    const scoreMap = {};
    const errs = [];
    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= {
                verified: [],
                completed: [],
                progressed: [],
                packs: [],
            };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        // Records
        level.records.forEach((record) => {
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;
            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
                packs: [],
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
                return;
            }

            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(rank + 1, record.percent, level.percentToQualify),
                link: record.link,
            });
        });
    });

    // Check completed packs for each user
    if (packs) {
        Object.entries(scoreMap).forEach(([user, scores]) => {
            const { completed, verified } = scores;
            const userCompletedLevelPaths = new Set();
            
            // Collect all completed level paths (100%) from completed records
            // We need to find the path for each completed level
            completed.forEach(record => {
                // Find the level path by matching level name
                const levelData = list.find(([level, err]) => level && level.name === record.level);
                if (levelData && levelData[0]) {
                    userCompletedLevelPaths.add(levelData[0].path);
                }
            });
            
            // Collect all verified level paths (verifications count as 100%)
            verified.forEach(record => {
                // Find the level path by matching level name
                const levelData = list.find(([level, err]) => level && level.name === record.level);
                if (levelData && levelData[0]) {
                    userCompletedLevelPaths.add(levelData[0].path);
                }
            });
            
            // Check each pack
            packs.forEach(pack => {
                const packCompleted = pack.levels.every(levelName => {
                    // Check if user has this level path completed or verified
                    return userCompletedLevelPaths.has(levelName);
                });
                
                if (packCompleted) {
                    scores.packs.push({
                        name: pack.name,
                        score: 0, // Packs don't give points
                    });
                }
            });
        });
    }

    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}

export async function fetchPacks() {
    try {
        const packsResult = await fetch(`${dir}/_packs.json`);
        const packs = await packsResult.json();
        return packs;
    } catch {
        console.error('Failed to load packs.');
        return null;
    }
}
