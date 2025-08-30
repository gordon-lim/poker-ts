import { CardRank, CardSuit } from '../lib/card';
export declare type FacadeCard = {
    rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
    suit: 'clubs' | 'diamonds' | 'hearts' | 'spades';
};
export declare type InternalCard = {
    rank: CardRank;
    suit: CardSuit;
};
/**
 * Converts a facade Card format to internal Card format
 * @param card - The facade card to convert
 * @returns The internal card representation
 */
export declare function convertCard(card: FacadeCard): InternalCard;
