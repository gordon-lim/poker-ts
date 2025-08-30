"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertCard = void 0;
var card_1 = require("../lib/card");
/**
 * Converts a facade Card format to internal Card format
 * @param card - The facade card to convert
 * @returns The internal card representation
 */
function convertCard(card) {
    // Map facade rank to CardRank enum
    var rankMap = {
        '2': card_1.CardRank._2,
        '3': card_1.CardRank._3,
        '4': card_1.CardRank._4,
        '5': card_1.CardRank._5,
        '6': card_1.CardRank._6,
        '7': card_1.CardRank._7,
        '8': card_1.CardRank._8,
        '9': card_1.CardRank._9,
        'T': card_1.CardRank.T,
        'J': card_1.CardRank.J,
        'Q': card_1.CardRank.Q,
        'K': card_1.CardRank.K,
        'A': card_1.CardRank.A
    };
    // Map facade suit to CardSuit enum
    var suitMap = {
        'clubs': card_1.CardSuit.CLUBS,
        'diamonds': card_1.CardSuit.DIAMONDS,
        'hearts': card_1.CardSuit.HEARTS,
        'spades': card_1.CardSuit.SPADES
    };
    var rank = rankMap[card.rank];
    var suit = suitMap[card.suit];
    if (rank === undefined) {
        throw new Error("Invalid card rank: " + card.rank);
    }
    if (suit === undefined) {
        throw new Error("Invalid card suit: " + card.suit);
    }
    return { rank: rank, suit: suit };
}
exports.convertCard = convertCard;
//# sourceMappingURL=card-converter.js.map