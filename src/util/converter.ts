import { CardRank, CardSuit } from '../lib/card'

export type FacadeCard = {
    rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'
    suit: 'clubs' | 'diamonds' | 'hearts' | 'spades'
}

export type InternalCard = {
    rank: CardRank
    suit: CardSuit
}

/**
 * Converts a facade Card format to internal Card format
 * @param card - The facade card to convert
 * @returns The internal card representation
 */
export function convertCard(card: FacadeCard): InternalCard {
    // Map facade rank to CardRank enum
    const rankMap: { [key: string]: CardRank } = {
        '2': CardRank._2,
        '3': CardRank._3,
        '4': CardRank._4,
        '5': CardRank._5,
        '6': CardRank._6,
        '7': CardRank._7,
        '8': CardRank._8,
        '9': CardRank._9,
        'T': CardRank.T,
        'J': CardRank.J,
        'Q': CardRank.Q,
        'K': CardRank.K,
        'A': CardRank.A
    }

    // Map facade suit to CardSuit enum
    const suitMap: { [key: string]: CardSuit } = {
        'clubs': CardSuit.CLUBS,
        'diamonds': CardSuit.DIAMONDS,
        'hearts': CardSuit.HEARTS,
        'spades': CardSuit.SPADES
    }

    const rank = rankMap[card.rank]
    const suit = suitMap[card.suit]

    if (rank === undefined) {
        throw new Error(`Invalid card rank: ${card.rank}`)
    }
    
    if (suit === undefined) {
        throw new Error(`Invalid card suit: ${card.suit}`)
    }

    return { rank, suit }
}
