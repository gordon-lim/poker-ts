import ChipRange from './chip-range';
import { SeatIndex } from 'types/seat-index';
import { Chips } from 'types/chips';
import { SeatArray } from 'types/seat-array';
export declare enum Action {
    LEAVE = 0,
    MATCH = 1,
    RAISE = 2
}
export declare class ActionRange {
    canRaise: boolean;
    chipRange: ChipRange;
    constructor(canRaise: boolean, chipRange?: ChipRange);
}
export default class BettingRound {
    private readonly _players;
    private _round;
    private _biggestBet;
    private _minRaise;
    constructor(players: SeatArray, firstToAct: SeatIndex, minRaise: Chips, biggestBet?: Chips);
    inProgress(): boolean;
    isContested(): boolean;
    /**
     * Checks if the betting round is at its very beginning with no actions taken yet.
     * This means the first player to act has not yet made any decision (fold, call, raise, etc.).
     *
     * Use this to determine if you're at the initial state of a betting round where
     * no betting actions have occurred.
     *
     * @returns true if no actions have been taken and the betting round is still in progress
     */
    isAtStartOfBettingRound(): boolean;
    /**
     * Checks if the betting round is in progress but actions have already been taken.
     * This means at least one player has acted (folded, called, raised, etc.) but there
     * are still more actions required before the betting round can be completed.
     *
     * Use this to determine if you're in the middle of active betting where some players
     * have acted but the round hasn't finished yet.
     *
     * @returns true if actions have been taken but the betting round is still in progress
     */
    isInMiddleOfBettingRound(): boolean;
    playerToAct(): SeatIndex;
    biggestBet(): Chips;
    minRaise(): Chips;
    players(): SeatArray;
    activePlayers(): boolean[];
    numActivePlayers(): number;
    legalActions(): ActionRange;
    actionTaken(action: Action, bet?: Chips): void;
    private isRaiseValid;
}
