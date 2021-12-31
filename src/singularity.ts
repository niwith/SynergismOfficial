import { DOMCacheGetOrSet } from "./Cache/DOM"
import { format, player } from "./Synergism"
import { Player } from "./types/Synergism"
import { Alert, Prompt } from "./UpdateHTML"
import { toOrdinal } from "./Utility"

/**
 * 
 * Updates all statistics related to Singularities in the Singularity Tab.
 * 
 */
export const updateSingularityStats = ():void => {
    const str = `You are in the ${toOrdinal(player.singularityCount)} singularity, and have ${format(player.goldenQuarks,0,true)} golden quarks.
                 Global Speed is divided by ${format(player.singularityCount + 1, 0, true)}.
                 Cube Gain is divided by ${format(1 + 1/16 * Math.pow(player.singularityCount, 2), 2, true)}.
                 Research Costs are multiplied by ${format(player.singularityCount + 1, 0, true)}.
                 Cube Upgrade Costs (Excluding Cookies) are multiplied by ${format(1 + 0.2 * player.singularityCount, 2, true)}.`
    DOMCacheGetOrSet('singularityMultiline').textContent = str;
}

export interface ISingularityData {
    name: string
    description: string
    level?: number
    maxLevel: number
    costPerLevel: number
    toggleBuy?: number
    goldenQuarksInvested?: number
}

/**
 * Singularity Upgrades are bought in the singularity tab, and all have their own
 * name, description, level and maxlevel, plus a feature to toggle buy on each.
 */
export class SingularityUpgrade {

    // Field Initialization
    private readonly name: string;
    private readonly description: string;
    public level = 0;
    private readonly maxLevel: number; //-1 = infinitely levelable
    private readonly costPerLevel: number; 
    public toggleBuy = 1; //-1 = buy MAX (or 1000 in case of infinity levels!)
    public goldenQuarksInvested = 0;

    public constructor(data: ISingularityData) {
        this.name = data.name;
        this.description = data.description;
        this.level = data.level ?? this.level;
        this.maxLevel = data.maxLevel;
        this.costPerLevel = data.costPerLevel;
        this.toggleBuy = data.toggleBuy ?? 1;
        this.goldenQuarksInvested = data.goldenQuarksInvested ?? 0;
    }

    /**
     * Given an upgrade, give a concise information regarding its data.
     * @returns A string that details the name, description, level statistic, and next level cost.
     */
    toString() {
        const costNextLevel = this.getCostTNL();
        const maxLevel = this.maxLevel === -1
            ? ''
            : `/${this.maxLevel}`;

        return `${this.name}
                ${this.description}
                Level ${this.level}${maxLevel}
                Cost for next level: ${format(costNextLevel)} Golden Quarks.
                Spent Quarks: ${format(this.goldenQuarksInvested, 0, true)}`
    }

    public updateUpgradeHTML() {
        DOMCacheGetOrSet('testingMultiline').textContent = this.toString()
    }

    /**
     * Retrieves the cost for upgrading the singularity upgrade once. Return 0 if maxed.
     * @returns A number representing how many Golden Quarks a player must have to upgrade once.
     */
    private getCostTNL() {
        return (this.maxLevel === this.level) ? 0: this.costPerLevel * (1 + this.level);
    }

    /**
     * Buy levels up until togglebuy or maxxed.
     * @returns An alert indicating cannot afford, already maxxed or purchased with how many
     *          levels purchased
     */
    public async buyLevel() {
        let purchased = 0;
        let maxPurchasable = (this.maxLevel === -1)
            ? ((this.toggleBuy === -1)
                ? 1000
                : this.toggleBuy)
            : Math.min(this.toggleBuy, this.maxLevel - this.level);

        if (maxPurchasable === 0)
            return Alert("hey! You have already maxxed this upgrade. :D")

        while (maxPurchasable > 0) {
            console.log('teehee')
            const cost = this.getCostTNL();
            if (player.goldenQuarks < cost) {
                break;
            } else {
                player.goldenQuarks -= cost;
                this.goldenQuarksInvested += cost;
                this.level += 1;
                purchased += 1;
                maxPurchasable -= 1;                
            }
        }
        
        if (purchased === 0)
            return Alert(`You cannot afford this upgrade. Sorry!`)

        this.updateUpgradeHTML();
        updateSingularityStats();
        DOMCacheGetOrSet("goldenQuarks").textContent = format(player.goldenQuarks)
    }

    public async changeToggle() {

        // Is null unless given an explicit number
        const newToggle = await Prompt(`
        Set maximum purchase amount per click for the ${this.name} upgrade.

        type -1 to set to MAX by default.
        `);
        const newToggleAmount = Number(newToggle);

        if (newToggle === null)
            return Alert(`Toggle kept at ${format(this.toggleBuy)}.`)

        if (!Number.isInteger(newToggle))
            return Alert("Toggle value must be a whole number!");
        if (newToggleAmount < -1)
            return Alert("The only valid negative number for toggle is -1.");
        if (newToggleAmount === 0)
            return Alert("You cannot set the toggle to 0.");

        this.toggleBuy = newToggleAmount;
        const m = newToggleAmount === -1
            ? `Your toggle is now set to MAX`
            : `Your toggle is now set to ${format(this.toggleBuy)}`;
            
        return Alert(m);
    }
}

export const singularityData: Record<keyof Player['singularityUpgrades'], ISingularityData> = {
    goldenQuarks1: {
        name: "Golden Quarks I",
        description: "In the future, you will gain 5% more Golden Quarks on singularities!",
        maxLevel: 10,
        costPerLevel: 12,
    },
    goldenQuarks2: {
        name: "Golden Quarks II",
        description: "If you buy this, you will gain 2% more Golden Quarks on singularities. Stacks with the first upgrade.",
        maxLevel: 25,
        costPerLevel: 60,
    },
    goldenQuarks3: {
        name: "Golden Quarks III",
        description: "If you buy this, you will gain 1 Golden Quark per hour from Exports.",
        maxLevel: 1,
        costPerLevel: 1000,
    },
    starterPack: {
        name: "Starter Pack",
        description: "Buy this! Buy This! Cube gain is permanently multiplied by 5, and gain 6x the Obtainium and Offerings from all sources, post-corruption.",
        maxLevel: 1,
        costPerLevel: 10,
    },
    wowPass: {
        name: "Wow Pass Unlock (WIP)",
        description: "This upgrade will convince the seal merchant to sell you more Wow Passes, which even persist on Singularity!.",
        maxLevel: 1,
        costPerLevel: 500,
    },
    cookies: {
        name: "Cookie Recipes I",
        description: "For just a few golden quarks, re-open Wow! Bakery, adding five cookie-related cube upgrades.",
        maxLevel: 1,
        costPerLevel: 100,
    },
    cookies2: {
        name: "Cookie Recipes II",
        description: "Diversify Wow! Bakery into cooking slightly more exotic cookies, adding five more cookie-related cube upgrades..",
        maxLevel: 1,
        costPerLevel: 500,
    },
    cookies3: {
        name: "Cookie Recipes III",
        description: "Your Bakers threaten to quit without a higher pay. If you do pay them, they will bake even more fancy cookies.",
        maxLevel: 1,
        costPerLevel: 5000,
    },
    cookies4: {
        name: "Cookie Recipes IV",
        description: "This is a small price to pay for Salvation.",
        maxLevel: 1,
        costPerLevel: 50000,
    },
    ascensions: {
        name: "Improved Ascension Gain",
        description: "Buying this, you will gain +2% Ascension Count forever, per level! Every 20 levels grants an additional, multiplicative +1% Ascension Count.",
        maxLevel: -1,
        costPerLevel: 5,
    },
    corruptionFourteen: {
        name: "Level Fourteen Corruptions (WIP)",
        description: "Buy this to unlock level fourteen corruptions :).",
        maxLevel: 1,
        costPerLevel: 1000,
    },
    corruptionFifteen: {
        name: "Level Fifteen Corruptions (WIP)",
        description: "Buy this to unlock level fifteen corruptions :)",
        maxLevel: 1,
        costPerLevel: 40000,
    },
    singOfferings1: {
        name: "Offering Charge",
        description: "Upgrade this to get +2% offerings per level, forever!",
        maxLevel: -1,
        costPerLevel: 1
    },
    singOfferings2: {
        name: "Offering Storm",
        description: "Apparently, you can use this bar to attract more offerings. +8% per level, to be precise.",
        maxLevel: 25,
        costPerLevel: 25
    },
    singOfferings3: {
        name: "Offering Tempest",
        description: "This bar is so prestine, it'll make anyone submit their offerings. +4% per level, to be precise.",
        maxLevel: 40,
        costPerLevel: 500
    },
    singObtainium1: {
        name: "Obtainium Wave",
        description: "Upgrade this to get +2% obtainium per level, forever!",
        maxLevel: -1,
        costPerLevel: 1
    },
    singObtainium2: {
        name: "Obtainium Flood",
        description: "Holy crap, water bending! +8% gained obtainium per level.",
        maxLevel: 25,
        costPerLevel: 25
    },
    singObtainium3: {
        name: "Obtainium Tsunami",
        description: "A rising tide lifts all boats. +4% gained obtainium per level.",
        maxLevel: 40,
        costPerLevel: 500
    },
    singCubes1: {
        name: "Cube Flame",
        description: "Upgrade this to get +2% Cubes per level, forever!",
        maxLevel: -1,
        costPerLevel: 1
    },
    singCubes2: {
        name: "Cube Blaze",
        description: "Burn some more Golden Quarks! +8% gained Cubes per level.",
        maxLevel: 25,
        costPerLevel: 25
    },
    singCubes3: {
        name: "Cube Inferno",
        description: "Even Dante is impressed. +4% gained Cubes per level.",
        maxLevel: 40,
        costPerLevel: 500
    },
}