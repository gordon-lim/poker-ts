import { convertCard, FacadeCard } from '../../src/util/converter'
import { CardRank, CardSuit } from '../../src/lib/card'

describe('convertCard', () => {
    describe('rank conversion', () => {
        test('should convert number ranks correctly', () => {
            const testCases: Array<[string, CardRank]> = [
                ['2', CardRank._2],
                ['3', CardRank._3],
                ['4', CardRank._4],
                ['5', CardRank._5],
                ['6', CardRank._6],
                ['7', CardRank._7],
                ['8', CardRank._8],
                ['9', CardRank._9]
            ]

            testCases.forEach(([facadeRank, expectedRank]) => {
                const card: FacadeCard = { rank: facadeRank as any, suit: 'hearts' }
                const result = convertCard(card)
                expect(result.rank).toBe(expectedRank)
            })
        })

        test('should convert Ten correctly', () => {
            const card: FacadeCard = { rank: 'T', suit: 'hearts' }
            const result = convertCard(card)
            expect(result.rank).toBe(CardRank.T)
        })

        test('should convert face cards correctly', () => {
            const testCases: Array<[string, CardRank]> = [
                ['J', CardRank.J],
                ['Q', CardRank.Q],
                ['K', CardRank.K],
                ['A', CardRank.A]
            ]

            testCases.forEach(([facadeRank, expectedRank]) => {
                const card: FacadeCard = { rank: facadeRank as any, suit: 'hearts' }
                const result = convertCard(card)
                expect(result.rank).toBe(expectedRank)
            })
        })
    })

    describe('suit conversion', () => {
        test('should convert all suits correctly', () => {
            const testCases: Array<[string, CardSuit]> = [
                ['clubs', CardSuit.CLUBS],
                ['diamonds', CardSuit.DIAMONDS],
                ['hearts', CardSuit.HEARTS],
                ['spades', CardSuit.SPADES]
            ]

            testCases.forEach(([facadeSuit, expectedSuit]) => {
                const card: FacadeCard = { rank: 'A', suit: facadeSuit as any }
                const result = convertCard(card)
                expect(result.suit).toBe(expectedSuit)
            })
        })
    })

    describe('complete card conversion', () => {
        test('should convert complete cards correctly', () => {
            const testCases: Array<[FacadeCard, { rank: CardRank, suit: CardSuit }]> = [
                [{ rank: '2', suit: 'clubs' }, { rank: CardRank._2, suit: CardSuit.CLUBS }],
                [{ rank: 'T', suit: 'diamonds' }, { rank: CardRank.T, suit: CardSuit.DIAMONDS }],
                [{ rank: 'J', suit: 'hearts' }, { rank: CardRank.J, suit: CardSuit.HEARTS }],
                [{ rank: 'A', suit: 'spades' }, { rank: CardRank.A, suit: CardSuit.SPADES }]
            ]

            testCases.forEach(([facadeCard, expected]) => {
                const result = convertCard(facadeCard)
                expect(result.rank).toBe(expected.rank)
                expect(result.suit).toBe(expected.suit)
            })
        })
    })

    describe('error handling', () => {
        test('should throw error for invalid rank', () => {
            const card = { rank: 'X', suit: 'hearts' } as any
            expect(() => convertCard(card)).toThrow('Invalid card rank: X')
        })

        test('should throw error for invalid suit', () => {
            const card = { rank: 'A', suit: 'invalid' } as any
            expect(() => convertCard(card)).toThrow('Invalid card suit: invalid')
        })
    })
})
