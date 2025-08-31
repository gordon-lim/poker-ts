import ChipRange from '../lib/chip-range';
import { SeatIndex } from 'types/seat-index';
import { HandRanking } from '../lib/hand';
import { SeatArray } from 'types/seat-array';
export declare type Card = {
    rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
    suit: 'clubs' | 'diamonds' | 'hearts' | 'spades';
};
export declare type AutomaticAction = 'fold' | 'check/fold' | 'check' | 'call' | 'call any' | 'all-in';
export declare type Action = 'fold' | 'check' | 'call' | 'bet' | 'raise';
export default class Poker {
    private _table;
    constructor(forcedBets: {
        ante?: number;
        bigBlind: number;
        smallBlind: number;
    }, numSeats?: number);
    playerToAct(): number;
    button(): number;
    seats(): ({
        totalChips: number;
        stack: number;
        betSize: number;
    } | null)[];
    handPlayers(): ({
        totalChips: number;
        stack: number;
        betSize: number;
    } | null)[];
    numActivePlayers(): number;
    initialHandPlayers(): SeatArray;
    pots(): {
        size: number;
        eligiblePlayers: number[];
    }[];
    forcedBets(): {
        ante: number;
        bigBlind: number;
        smallBlind: number;
    };
    setForcedBets(forcedBets: {
        ante?: number;
        bigBlind: number;
        smallBlind: number;
    }): void;
    numSeats(): number;
    startHand(seat?: number): void;
    isHandInProgress(): boolean;
    isBettingRoundInProgress(): boolean;
    areBettingRoundsCompleted(): boolean;
    /**
     * Checks if the current betting round is at its very beginning with no actions taken yet.
     * This indicates that the first player to act has not yet made any decision.
     *
     * @returns true if no actions have been taken and a betting round is in progress
     */
    isAtStartOfBettingRound(): boolean;
    /**
     * Checks if the current betting round has actions taken but is still in progress.
     * This means at least one player has acted but there are still more actions required
     * before the betting round can be completed.
     *
     * @returns true if actions have been taken but the betting round is still in progress
     */
    isInMiddleOfBettingRound(): boolean;
    roundOfBetting(): 'preflop' | 'flop' | 'turn' | 'river';
    communityCards(): Card[];
    legalActions(): {
        actions: Action[];
        chipRange?: ChipRange;
    };
    holeCards(): (Card[] | null)[];
    actionTaken(action: 'fold' | 'check' | 'call' | 'bet' | 'raise', betSize?: number): void;
    endBettingRound(): void;
    showdown(): void;
    setCommunityCards(cards: Card[]): void;
    setPlayerHoleCards(seatIndex: number, cards: Card[]): void;
    manualShowdown(communityCards: Card[], playerHoleCards: {
        [seatIndex: number]: Card[];
    }): void;
    winners(): [SeatIndex, {
        cards: Card[];
        ranking: HandRanking;
        strength: number;
    }, Card[], number][][];
    automaticActions(): (AutomaticAction | null)[];
    canSetAutomaticActions(seatIndex: number): boolean;
    legalAutomaticActions(seatIndex: number): AutomaticAction[];
    setAutomaticAction(seatIndex: number, action: AutomaticAction | null): void;
    sitDown(seatIndex: number, buyIn: number): void;
    standUp(seatIndex: number): void;
}
