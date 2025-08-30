import Dealer, {Action} from '../../src/lib/dealer'
import {ForcedBets} from '../../src/types/forced-bets'
import Deck from '../../src/lib/deck'
import CommunityCards, {RoundOfBetting} from '../../src/lib/community-cards'
import {SeatArray} from '../../src/types/seat-array'
import Player from '../../src/lib/player'
import Card, {CardRank, CardSuit} from '../../src/lib/card'
import { makeCards } from '../helper/card'
import {
    shuffleForThreePlayersWithTwoWinners,
    shuffleForTwoPlayersDraw,
    shuffleForTwoPlayersWithFullHouseWinner,
} from '../helper/card'
import {HandRanking} from '../../src/lib/hand'

describe('Dealer', () => {
    describe('Starting the hand', () => {
        let forcedBets: ForcedBets
        let deck: Deck
        let communityCards: CommunityCards

        beforeEach(() => {
            forcedBets = { blinds: { big: 50, small: 25 } }
            // tslint:disable-next-line:no-empty
            deck = new Deck(() => {})
            communityCards = new CommunityCards()
        })

        describe('A hand with with two players where the big blind has just enough to cover the blind', () => {
            let players: SeatArray
            let dealer: Dealer

            beforeEach(() => {
                players = new Array(9).fill(null)
                players[0] = new Player(100)
                players[1] = new Player(50)
                dealer = new Dealer(players, 0, forcedBets, deck, communityCards)

                dealer.startHand()
            })

            test('Betting round should be in progress', () => {
                expect(dealer.bettingRoundInProgress()).toBeTruthy()
            })

            test('Small blind should be allowed to fold, call, or raise', () => {
                const { action } = dealer.legalActions()
                expect(action & Action.FOLD).toBeTruthy()
                expect(action & Action.CHECK).toBeFalsy()
                expect(action & Action.CALL).toBeTruthy()
                expect(action & Action.BET).toBeFalsy()
                expect(action & Action.RAISE).toBeTruthy()
            })

            test('Betting round should still be in progress after small blind calls and big blind should be allowed to fold or check', () => {
                dealer.actionTaken(Action.CALL)

                const { action } = dealer.legalActions()
                expect(action & Action.FOLD).toBeTruthy()
                expect(action & Action.CHECK).toBeTruthy()
                expect(action & Action.CALL).toBeFalsy()
                expect(action & Action.BET).toBeFalsy()
                expect(action & Action.RAISE).toBeFalsy()
            })

            test('Betting round and should not be in progress after small blind calls and big blind checks', () => {
                dealer.actionTaken(Action.CALL)
                dealer.actionTaken(Action.CHECK)

                expect(dealer.bettingRoundInProgress()).toBeFalsy()
            })
        })

        describe('A hand with two players who can cover their blinds', () => {
            let players: SeatArray
            let dealer: Dealer
            beforeEach(() => {
                players = new Array(9).fill(null)
                players[0] = new Player(100)
                players[1] = new Player(100)
                dealer = new Dealer(players, 0, forcedBets, deck, communityCards)
            })

            describe('The hand starts', () => {
                beforeEach(() => {
                    dealer.startHand()
                })

                test('The button has posted the small blind', () => {
                    expect(players[0]?.betSize()).toBe(25)
                })

                test('The other player has posted the big blind', () => {
                    expect(players[1]?.betSize()).toBe(50)
                })

                test('The action is on the button', () => {
                    expect(dealer.playerToAct()).toBe(0)
                })
            })
        })

        describe('A hand with two players who can\'t cover their blinds', () => {
            let players: SeatArray
            let dealer: Dealer
            beforeEach(() => {
                players = new Array(9).fill(null)
                players[0] = new Player(20)
                players[1] = new Player(20)
                dealer = new Dealer(players, 0, forcedBets, deck, communityCards)
            })

            describe('The hand starts', () => {
                beforeEach(() => {
                    dealer.startHand()
                })

                test('The betting round is not in progress', () => {
                    expect(dealer.bettingRoundInProgress()).toBeFalsy()
                    dealer.endBettingRound()
                    expect(dealer.bettingRoundInProgress()).toBeFalsy()
                    expect(dealer.bettingRoundsCompleted()).toBeTruthy()
                    expect(dealer.roundOfBetting()).toBe(RoundOfBetting.RIVER)
                    dealer.showdown()
                    expect(dealer.handInProgress()).toBeFalsy()
                })

            })
        })

        describe('A hand with more than two players', () => {
            let players: SeatArray
            let dealer: Dealer
            beforeEach(() => {
                players = new Array(9).fill(null)
                players[0] = new Player(100)
                players[1] = new Player(100)
                players[2] = new Player(100)
                players[3] = new Player(100)
                dealer = new Dealer(players, 0, forcedBets, deck, communityCards)
            })

            describe('The hand starts', () => {
                beforeEach(() => {
                    dealer.startHand()
                })

                test('The button+1 has posted the small blind', () => {
                    expect(players[1]?.betSize()).toBe(25)
                })

                test('The button+2 has posted the big blind', () => {
                    expect(players[2]?.betSize()).toBe(50)
                })

                test('The action is on the button+3', () => {
                    expect(dealer.playerToAct()).toBe(3)
                })
            })
        })
    })

    describe('Ending the betting round', () => {
        let forcedBets: ForcedBets
        let deck: Deck
        let communityCards: CommunityCards
        let players: SeatArray
        let dealer: Dealer

        beforeEach(() => {
            forcedBets = { blinds: { big: 50, small: 25 } }
            deck = new Deck()
            communityCards = new CommunityCards()
            players = new Array(9).fill(null)
            players[0] = new Player(1000)
            players[1] = new Player(1000)
            players[2] = new Player(1000)
            dealer = new Dealer(players, 0, forcedBets, deck, communityCards)
        })

        describe('There is two or more active players at the end of any betting round except river', () => {
            beforeEach(() => {
                dealer.startHand()
                dealer.actionTaken(Action.CALL)
                dealer.actionTaken(Action.CALL)
                dealer.actionTaken(Action.CHECK)
            })

            test('precondition', () => {
                expect(dealer.bettingRoundInProgress()).toBeFalsy()
                expect(dealer.numActivePlayers()).toBeGreaterThan(2)
                expect(dealer.roundOfBetting()).not.toBe(RoundOfBetting.RIVER)
                expect(communityCards.cards().length).toBe(0)
            })

            describe('The betting round is ended', () => {
                beforeEach(() => {
                    dealer.endBettingRound()
                })

                test('The next betting round begins', () => {
                    expect(dealer.bettingRoundInProgress()).toBeTruthy()
                    expect(dealer.roundOfBetting()).toBe(RoundOfBetting.FLOP)
                    expect(communityCards.cards().length).toBe(3)
                })
            })
        })

        describe('There is two or more active players at the end of river', () => {
            beforeEach(() => {
                dealer.startHand()

                // preflop
                dealer.actionTaken(Action.CALL)
                dealer.actionTaken(Action.CALL)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                // flop
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                // turn
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                // river
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                // not ended yet
            })

            test('precondition', () => {
                expect(dealer.bettingRoundInProgress()).toBeFalsy()
                expect(dealer.roundOfBetting()).toBe(RoundOfBetting.RIVER)
                expect(communityCards.cards().length).toBe(5)
            })

            describe('The betting round is ended', () => {
                beforeEach(() => {
                    dealer.endBettingRound()
                })

                test('precondition', () => {
                    expect(dealer.bettingRoundInProgress()).toBeFalsy()
                    expect(dealer.bettingRoundsCompleted()).toBeTruthy()
                    expect(dealer.roundOfBetting()).toBe(RoundOfBetting.RIVER)
                })

                test('The hand is over', () => {
                    dealer.showdown()
                    expect(dealer.handInProgress()).toBeFalsy()
                })
            })
        })

        describe('There is one or less active players at the end of a betting round and more than one player in all pots', () => {
            beforeEach(() => {
                dealer.startHand()
                dealer.actionTaken(Action.RAISE, 1000)
                dealer.actionTaken(Action.CALL)
                dealer.actionTaken(Action.FOLD)
            })

            test('precondition', () => {
                expect(dealer.bettingRoundInProgress()).toBeFalsy()
                expect(dealer.numActivePlayers()).toBeLessThan(1)
                expect(dealer.roundOfBetting()).not.toBe(RoundOfBetting.RIVER)
                expect(communityCards.cards().length).toBe(0)
            })

            describe('The betting round is ended', () => {
                beforeEach(() => {
                    dealer.endBettingRound()
                    dealer.showdown()
                })

                test('The hand is over', () => {
                    expect(dealer.handInProgress()).toBeFalsy()
                })

                test('The undealt community cards (if any) are dealt', () => {
                    expect(communityCards.cards().length).toBe(5)
                })
            })
        })

        describe('There is one or less active players at the end of a betting round and a single player in a single pot', () => {
            beforeEach(() => {
                dealer.startHand()
                dealer.actionTaken(Action.RAISE, 1000)
                dealer.actionTaken(Action.FOLD)
                dealer.actionTaken(Action.FOLD)
            })

            test('precondition', () => {
                expect(dealer.bettingRoundInProgress()).toBeFalsy()
                expect(dealer.numActivePlayers()).toBeLessThan(1)
                expect(dealer.roundOfBetting()).not.toBe(RoundOfBetting.RIVER)
                expect(communityCards.cards().length).toBe(0)
            })

            describe('The betting round is ended', () => {
                beforeEach(() => {
                    dealer.endBettingRound()
                    dealer.showdown()
                })

                test('The hand is over', () => {
                    expect(dealer.handInProgress()).toBeFalsy()
                })

                test('The undealt community cards (if any) are not dealt', () => {
                    expect(communityCards.cards().length).toBe(0)
                })
            })
        })
    })

    describe('flop, someone folded preflop, now others fold, when 1 remains, the hand should be over', () => {
        let forcedBets: ForcedBets
        let deck: Deck
        let communityCards: CommunityCards
        let players: SeatArray
        let dealer: Dealer

        beforeEach(() => {
            forcedBets = { blinds: { big: 50, small: 25 } }
            deck = new Deck()
            communityCards = new CommunityCards()
            players = new Array(9).fill(null)
            players[0] = new Player(1000)
            players[1] = new Player(1000)
            players[2] = new Player(1000)
            dealer = new Dealer(players, 0, forcedBets, deck, communityCards)

            dealer.startHand()
            dealer.actionTaken(Action.FOLD)
            dealer.actionTaken(Action.CALL)
            dealer.actionTaken(Action.CHECK)
        })

        test('betting round is not in progress after last remaining player folds', () => {
            expect(dealer.bettingRoundInProgress()).toBeFalsy()
            dealer.endBettingRound()
            dealer.actionTaken(Action.FOLD)
            expect(dealer.bettingRoundInProgress()).toBeFalsy()
        })

        describe('The betting round is ended', () => {
            beforeEach(() => {
                dealer.endBettingRound()
            })

            test('Player folds', () => {
                dealer.actionTaken(Action.FOLD)
                expect(dealer.bettingRoundInProgress()).toBeFalsy()
            })
        })
    })

    describe('Showdown', () => {
        describe('single pot single player', () => {
            let forcedBets: ForcedBets
            let deck: Deck
            let communityCards: CommunityCards
            let players: SeatArray
            let dealer: Dealer

            beforeEach(() => {
                forcedBets = { blinds: { big: 50, small: 25 } }
                deck = new Deck()
                communityCards = new CommunityCards()
                players = new Array(9).fill(null)
                players[0] = new Player(1000)
                players[1] = new Player(1000)
                players[2] = new Player(1000)
                dealer = new Dealer(players, 0, forcedBets, deck, communityCards)

                dealer.startHand()
                dealer.actionTaken(Action.RAISE, 1000)
                dealer.actionTaken(Action.FOLD)
                dealer.actionTaken(Action.FOLD)
                dealer.endBettingRound()
                dealer.showdown()
            })

            test('single winner', () => {
                expect(dealer.handInProgress()).toBeFalsy()
                expect(players[0]?.stack()).toBe(1075)
            })
        })

        describe('single winner after full round', () => {
            let forcedBets: ForcedBets
            let deck: Deck
            let communityCards: CommunityCards
            let players: SeatArray
            let dealer: Dealer

            beforeEach(() => {
                forcedBets = { blinds: { big: 50, small: 25 } }
                // tslint:disable-next-line:no-empty
                deck = new Deck(() => {})
                communityCards = new CommunityCards()
                players = new Array(9).fill(null)
                players[0] = new Player(1000)
                players[1] = new Player(1000)
                players[2] = new Player(1000)
                dealer = new Dealer(players, 0, forcedBets, deck, communityCards)

                dealer.startHand()

                dealer.actionTaken(Action.RAISE, 500)
                dealer.actionTaken(Action.CALL)
                dealer.actionTaken(Action.CALL)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.showdown()
            })

            test('pot has been divided', () => {
                expect(players[0]?.stack()).toBe(500)
                expect(players[1]?.stack()).toBe(500)
                expect(players[2]?.stack()).toBe(2000)
            })

            test('reveal winner hand', () => {
                const firstWinnerInFirstPot = dealer.winners()[0][0];
                const [seatIndex, hand, holeCards] = firstWinnerInFirstPot;
                expect(seatIndex).toBe(2)
                expect(hand.ranking()).toBe(HandRanking.STRAIGHT_FLUSH)
                expect(hand.strength()).toBe(8)
                expect(hand.cards()).toEqual([
                    new Card(8, 3),
                    new Card(7, 3),
                    new Card(6, 3),
                    new Card(5, 3),
                    new Card(4, 3),
                ])
                expect(holeCards).toEqual([
                    new Card(8, 3),
                    new Card(7, 3),
                ])
            })
        })

        describe('single winner with full house after full round', () => {
            let forcedBets: ForcedBets
            let deck: Deck
            let communityCards: CommunityCards
            let players: SeatArray
            let dealer: Dealer

            beforeEach(() => {
                forcedBets = { blinds: { big: 50, small: 25 } }
                deck = new Deck(shuffleForTwoPlayersWithFullHouseWinner)
                communityCards = new CommunityCards()
                players = new Array(9).fill(null)
                players[0] = new Player(1000)
                players[1] = new Player(1000)
                dealer = new Dealer(players, 0, forcedBets, deck, communityCards)

                dealer.startHand()

                dealer.actionTaken(Action.RAISE, 500)
                dealer.actionTaken(Action.CALL)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.showdown()
            })

            test('pot has been divided', () => {
                expect(players[0]?.stack()).toBe(1500)
                expect(players[1]?.stack()).toBe(500)
            })

            test('reveal winner hand', () => {
                const firstWinnerInFirstPot = dealer.winners()[0][0];
                const [seatIndex, hand, holeCards] = firstWinnerInFirstPot;
                expect(seatIndex).toBe(0)
                expect(hand.ranking()).toBe(HandRanking.FULL_HOUSE)
                expect(hand.strength()).toBe(57122)
                expect(hand.cards()).toEqual([
                    new Card(2, 3),
                    new Card(2, 0),
                    new Card(2, 1),
                    new Card(0, 0),
                    new Card(0, 3),
                ])
                expect(holeCards).toEqual([
                    new Card(2, 3),
                    new Card(2, 0),
                ])
            })
        })

        describe('all players winners', () => {
            let forcedBets: ForcedBets
            let deck: Deck
            let communityCards: CommunityCards
            let players: SeatArray
            let dealer: Dealer

            beforeEach(() => {
                forcedBets = { blinds: { big: 50, small: 25 } }
                deck = new Deck(shuffleForTwoPlayersDraw)
                communityCards = new CommunityCards()
                players = new Array(9).fill(null)
                players[0] = new Player(1000)
                players[1] = new Player(1000)
                dealer = new Dealer(players, 0, forcedBets, deck, communityCards)

                dealer.startHand()

                dealer.actionTaken(Action.RAISE, 500)
                dealer.actionTaken(Action.CALL)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.showdown()
            })

            test('pot has been divided equally', () => {
                expect(players[0]?.stack()).toBe(1000)
                expect(players[1]?.stack()).toBe(1000)
            })
        })

        describe('two winners share odd pot', () => {
            let forcedBets: ForcedBets
            let deck: Deck
            let communityCards: CommunityCards
            let players: SeatArray
            let dealer: Dealer

            beforeEach(() => {
                forcedBets = { blinds: { big: 50, small: 25 } }
                deck = new Deck(shuffleForThreePlayersWithTwoWinners)
                communityCards = new CommunityCards()
                players = new Array(9).fill(null)
                players[0] = new Player(1000)
                players[1] = new Player(1000)
                players[2] = new Player(1000)
                dealer = new Dealer(players, 0, forcedBets, deck, communityCards)

                dealer.startHand()

                dealer.actionTaken(Action.RAISE, 501)
                dealer.actionTaken(Action.CALL)
                dealer.actionTaken(Action.CALL)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.actionTaken(Action.CHECK)
                dealer.endBettingRound()

                dealer.showdown()
            })

            test('pot has been divided', () => {
                expect(players[0]?.stack()).toBe(499)
                expect(players[1]?.stack()).toBe(1251)
                expect(players[2]?.stack()).toBe(1250)
            })
        })


        describe('multiple pots, multiple winners', () => {
            let forcedBets: ForcedBets
            let deck: Deck
            let communityCards: CommunityCards
            let players: SeatArray
            let dealer: Dealer

            beforeEach(() => {
                forcedBets = { blinds: { big: 50, small: 25 } }
                deck = new Deck()
                communityCards = new CommunityCards()
                players = new Array(9).fill(null)
                players[0] = new Player(300)
                players[1] = new Player(200)
                players[2] = new Player(100)
                dealer = new Dealer(players, 0, forcedBets, deck, communityCards)

                dealer.startHand()
                dealer.actionTaken(Action.RAISE, 300)
                dealer.actionTaken(Action.CALL)
                dealer.actionTaken(Action.CALL)
                dealer.endBettingRound()

                communityCards = new CommunityCards()
                communityCards.deal([
                    new Card(CardRank.A, CardSuit.SPADES),
                    new Card(CardRank.K, CardSuit.SPADES),
                    new Card(CardRank.Q, CardSuit.SPADES),
                    new Card(CardRank.J, CardSuit.SPADES),
                    new Card(CardRank.T, CardSuit.SPADES),
                ])

                // ...
            })
        })

        describe('Calling on the big blind does not cause a crash', () => {
            // dealer::action_taken did not deduct the bet from the folding player, but only read it.
            // This caused player.bet() to fail, because a smaller bet than the existing one was placed.
            // This is a design problem. If bet sizes did not outlive the dealer, accessing old ones would
            // be outside of the realm of possibility.
            test('Calling on the big blind', () => {
                const forcedBets = { blinds: { big: 50, small: 25 } }
                let deck = new Deck()
                let communityCards = new CommunityCards()
                const players = new Array(9).fill(null)
                players[0] = new Player(1000)
                players[1] = new Player(1000)
                let dealer = new Dealer(players, 0, forcedBets, deck, communityCards)
                dealer.startHand()
                dealer.actionTaken(Action.CALL)
                dealer.actionTaken(Action.FOLD)
                dealer.endBettingRound()
                dealer.showdown()

                deck = new Deck()
                communityCards = new CommunityCards()
                dealer = new Dealer(players, 1, forcedBets, deck, communityCards)

                expect(() => {
                    dealer.startHand()
                }).not.toThrow()
            })
        })
    })

    describe('Manual showdown', () => {
        let players: SeatArray
        let dealer: Dealer
        let forcedBets: ForcedBets
        let deck: Deck
        let communityCards: CommunityCards
        let initialStack0: number
        let initialStack1: number
        let initialStack2: number

        beforeEach(() => {
            forcedBets = { blinds: { big: 50, small: 25 } }
            deck = new Deck(() => {})
            communityCards = new CommunityCards()
            players = new Array(9).fill(null)
            players[0] = new Player(1000)
            players[1] = new Player(1000)
            players[2] = new Player(1000)
            
            // Capture initial stacks before any betting occurs
            initialStack0 = players[0]!.stack()
            initialStack1 = players[1]!.stack()
            initialStack2 = players[2]!.stack()
            
            dealer = new Dealer(players, 0, forcedBets, deck, communityCards)
            dealer.startHand()
        })

        describe('setCommunityCards', () => {
            test('should set community cards correctly', () => {
                const testCards = makeCards('As Ks Qs Js Ts')
                dealer.setCommunityCards(testCards)
                
                // Access community cards through a method that doesn't require full game state
                expect(dealer._communityCards.cards()).toHaveLength(5)
                expect(dealer._communityCards.cards()[0].rank).toBe(CardRank.A)
                expect(dealer._communityCards.cards()[0].suit).toBe(CardSuit.SPADES)
            })

            test('should throw error if more than 5 cards provided', () => {
                const testCards = makeCards('As Ks Qs Js Ts 2h')
                expect(() => dealer.setCommunityCards(testCards)).toThrow('Cannot set more than 5 community cards')
            })

            test('should allow setting fewer than 5 cards', () => {
                const testCards = makeCards('As Ks Qs')
                expect(() => dealer.setCommunityCards(testCards)).not.toThrow()
                expect(dealer._communityCards.cards()).toHaveLength(3)
            })
        })

        describe('setHoleCards', () => {
            test('should set hole cards for a player correctly', () => {
                const testCards = makeCards('Ah Kh')
                dealer.setHoleCards(0, testCards)
                
                const holeCards = dealer.holeCards()
                expect(holeCards[0]).toHaveLength(2)
                expect(holeCards[0]![0].rank).toBe(CardRank.A)
                expect(holeCards[0]![0].suit).toBe(CardSuit.HEARTS)
                expect(holeCards[0]![1].rank).toBe(CardRank.K)
                expect(holeCards[0]![1].suit).toBe(CardSuit.HEARTS)
            })

            test('should throw error if not exactly 2 cards provided', () => {
                const testCards = makeCards('Ah Kh Qh')
                expect(() => dealer.setHoleCards(0, testCards)).toThrow('Hole cards must be exactly 2 cards')
            })

            test('should throw error for invalid seat index', () => {
                const testCards = makeCards('Ah Kh')
                expect(() => dealer.setHoleCards(-1, testCards)).toThrow('Invalid seat index')
                expect(() => dealer.setHoleCards(10, testCards)).toThrow('Invalid seat index')
            })
        })

        describe('all players reach showdown', () => {
            beforeEach(() => {
                // Set up a complete betting scenario to reach showdown state
                dealer.actionTaken(Action.CALL) // Player 0 calls
                dealer.actionTaken(Action.CALL) // Player 1 calls  
                dealer.actionTaken(Action.CHECK) // Player 2 checks
                dealer.endBettingRound() // End preflop
                
                dealer.actionTaken(Action.CHECK) // Player 1 checks
                dealer.actionTaken(Action.CHECK) // Player 2 checks
                dealer.actionTaken(Action.CHECK) // Player 0 checks
                dealer.endBettingRound() // End flop
                
                dealer.actionTaken(Action.CHECK) // Player 1 checks
                dealer.actionTaken(Action.CHECK) // Player 2 checks
                dealer.actionTaken(Action.CHECK) // Player 0 checks
                dealer.endBettingRound() // End turn
                
                dealer.actionTaken(Action.CHECK) // Player 1 checks
                dealer.actionTaken(Action.CHECK) // Player 2 checks
                dealer.actionTaken(Action.CHECK) // Player 0 checks
                dealer.endBettingRound() // End river
            })

            test('should perform manual showdown with royal flush winner', () => {
                const communityCards = makeCards('Ah Kh Qh Jh Ks')
                const playerCards = new Map()
                playerCards.set(0, makeCards('Th 8h')) // Royal flush
                playerCards.set(1, makeCards('As Ks')) // Full house
                playerCards.set(2, makeCards('2c 3c')) // Pair

                dealer.manualShowdown(communityCards, playerCards)

                expect(dealer.handInProgress()).toBeFalsy()
                // Player 0 should win the entire pot (150 chips: 25+25+25+25+25+25)
                expect(players[0]!.stack()).toBeGreaterThan(initialStack0)
                expect(players[1]!.stack()).toBeLessThan(initialStack1)
                expect(players[2]!.stack()).toBeLessThan(initialStack2)
            })

            test('should handle split pot correctly', () => {
                const communityCards = makeCards('Ac 7d Ts 5h 3c')
                const playerCards = new Map()
                playerCards.set(0, makeCards('As Kc')) // Pair of aces (tie)
                playerCards.set(1, makeCards('Ah Kd')) // Pair of aces (tie)
                playerCards.set(2, makeCards('2c 6c')) // High card ace

                dealer.manualShowdown(communityCards, playerCards)

                expect(dealer.handInProgress()).toBeFalsy()
                // Both players should have equal stacks (split pot)
                expect(players[0]!.stack()).toBe(players[1]!.stack())
                expect(players[0]!.stack()).toBeGreaterThan(initialStack0)
                expect(players[1]!.stack()).toBeGreaterThan(initialStack1)
            })

            test('should throw error if not exactly 5 community cards provided', () => {
                const communityCards = makeCards('Ah Kh Qh Jh')
                const playerCards = new Map()
                playerCards.set(0, makeCards('9h 8h'))

                expect(() => dealer.manualShowdown(communityCards, playerCards)).toThrow('Must provide exactly 5 community cards')
            })
        })

        describe('all but one player folds', () => {
            beforeEach(() => {
                dealer.actionTaken(Action.CALL) // Player 0 calls
                dealer.actionTaken(Action.CALL) // Player 1 calls  
                dealer.actionTaken(Action.CHECK) // Player 2 checks
                dealer.endBettingRound() // End preflop

                dealer.actionTaken(Action.RAISE, 50) // Player 1 raises
                dealer.actionTaken(Action.FOLD) // Player 2 folds
                dealer.actionTaken(Action.FOLD) // Player 0 folds
                dealer.endBettingRound() // End flop
            })

            test('should handle single player remaining', () => {
                const communityCards = makeCards('Ah Kh Qh Jh Th')
                const playerCards = new Map()
                playerCards.set(0, makeCards('9h 8h')) // Only one player

                dealer.manualShowdown(communityCards, playerCards)

                expect(dealer.handInProgress()).toBeFalsy()
                expect(players[0]!.stack()).toBe(initialStack0 - 50)
                expect(players[1]!.stack()).toBe(initialStack1 + 100)
                expect(players[2]!.stack()).toBe(initialStack2 - 50)
            })
        })
    })

    describe('betting round state functions', () => {
        let players: SeatArray
        let dealer: Dealer
        let forcedBets: ForcedBets
        let deck: Deck
        let communityCards: CommunityCards

        beforeEach(() => {
            players = new Array(9).fill(null)
            players[0] = new Player(1000)
            players[1] = new Player(1000)
            players[2] = new Player(1000)
            
            forcedBets = {
                blinds: {
                    small: 25,
                    big: 50
                }
            }
            
            deck = new Deck()
            communityCards = new CommunityCards()
            dealer = new Dealer(players, 0, forcedBets, deck, communityCards)
        })

        describe('before hand starts', () => {
            test('should throw error when checking betting round state without hand in progress', () => {
                expect(() => dealer.isAtStartOfBettingRound()).toThrow('Hand must be in progress')
                expect(() => dealer.isInMiddleOfBettingRound()).toThrow('Hand must be in progress')
            })
        })

        describe('during hand', () => {
            beforeEach(() => {
                dealer.startHand()
            })

            test('should be at start of betting round initially', () => {
                expect(dealer.handInProgress()).toBe(true)
                expect(dealer.bettingRoundInProgress()).toBe(true)
                expect(dealer.isAtStartOfBettingRound()).toBe(true)
                expect(dealer.isInMiddleOfBettingRound()).toBe(false)
            })

            test('should be in middle of betting round after first action', () => {
                // First player to act takes action
                dealer.actionTaken(Action.CALL)
                
                expect(dealer.bettingRoundInProgress()).toBe(true)
                expect(dealer.isAtStartOfBettingRound()).toBe(false)
                expect(dealer.isInMiddleOfBettingRound()).toBe(true)
            })

            test('should transition through states correctly during betting', () => {
                // Start state
                expect(dealer.isAtStartOfBettingRound()).toBe(true)
                expect(dealer.isInMiddleOfBettingRound()).toBe(false)

                // First action - enter middle state
                dealer.actionTaken(Action.CALL) // Player 0 calls
                expect(dealer.isAtStartOfBettingRound()).toBe(false)
                expect(dealer.isInMiddleOfBettingRound()).toBe(true)

                // More actions - stay in middle state
                dealer.actionTaken(Action.RAISE, 100) // Player 1 raises
                expect(dealer.isAtStartOfBettingRound()).toBe(false)
                expect(dealer.isInMiddleOfBettingRound()).toBe(true)

                dealer.actionTaken(Action.CALL) // Player 2 calls
                expect(dealer.isAtStartOfBettingRound()).toBe(false)
                expect(dealer.isInMiddleOfBettingRound()).toBe(true)

                dealer.actionTaken(Action.CALL) // Player 0 calls the raise
                expect(dealer.isAtStartOfBettingRound()).toBe(false)
                expect(dealer.isInMiddleOfBettingRound()).toBe(false) // Round ended
                expect(dealer.bettingRoundInProgress()).toBe(false)
            })

            test('should handle folding players correctly', () => {
                // Start state
                expect(dealer.isAtStartOfBettingRound()).toBe(true)
                
                // Players fold one by one
                dealer.actionTaken(Action.FOLD) // Player 0 folds
                expect(dealer.isInMiddleOfBettingRound()).toBe(true)
                
                dealer.actionTaken(Action.FOLD) // Player 1 folds
                // Now only player 2 remains, round should end
                expect(dealer.bettingRoundInProgress()).toBe(false)
                expect(dealer.isAtStartOfBettingRound()).toBe(false)
                expect(dealer.isInMiddleOfBettingRound()).toBe(false)
            })

            test('should handle new betting round states correctly', () => {
                // Complete first betting round
                dealer.actionTaken(Action.CALL) // Player 0 calls
                dealer.actionTaken(Action.CALL) // Player 1 calls  
                dealer.actionTaken(Action.CHECK) // Player 2 checks
                dealer.endBettingRound()

                // New betting round should start fresh
                expect(dealer.bettingRoundInProgress()).toBe(true)
                expect(dealer.isAtStartOfBettingRound()).toBe(true)
                expect(dealer.isInMiddleOfBettingRound()).toBe(false)

                // First action in new round
                dealer.actionTaken(Action.CHECK) // First player checks
                expect(dealer.isAtStartOfBettingRound()).toBe(false)
                expect(dealer.isInMiddleOfBettingRound()).toBe(true)
            })
        })

        describe('edge cases', () => {
            test('should handle all-in scenarios correctly', () => {
                // Create players with limited chips
                const limitedPlayers: SeatArray = new Array(9).fill(null)
                limitedPlayers[0] = new Player(30) // Less than big blind
                limitedPlayers[1] = new Player(75) // Just enough for one raise
                limitedPlayers[2] = new Player(1000) // Normal stack
                
                const limitedDealer = new Dealer(limitedPlayers, 0, forcedBets, new Deck(), new CommunityCards())
                limitedDealer.startHand()
                
                expect(limitedDealer.isAtStartOfBettingRound()).toBe(true)
                
                // Player goes all-in
                limitedDealer.actionTaken(Action.CALL) // Player 0 goes all-in (30 chips)
                expect(limitedDealer.isInMiddleOfBettingRound()).toBe(true)
            })
        })
    })
})