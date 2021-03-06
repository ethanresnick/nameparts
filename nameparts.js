;(function(root) {
    const SALUTATIONS = new Set([
        'MR', 'MS', 'MRS', 'DR', 'MISS', 'DOCTOR', 'CORP', 'SGT', 'PVT', 'JUDGE',
        'CAPT', 'COL', 'MAJ', 'LT', 'LIEUTENANT', 'PRM', 'PATROLMAN', 'HON',
        'OFFICER', 'REV', 'PRES', 'PRESIDENT',
        'GOV', 'GOVERNOR', 'VICE PRESIDENT', 'VP', 'MAYOR', 'SIR', 'MADAM', 'HONERABLE'
    ]);
    
    const GENERATIONS = new Set([
        'JR', 'SR', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
        '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH',
        'FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH',
        'EIGHTH', 'NINTH', 'TENTH'
    ]);

    const SUFFIXES = new Set(['ESQ', 'PHD', 'MD']);

    const LNPREFIXES = new Set([
        'DE', 'DA', 'DI', 'LA', 'DU', 'DEL', 'DEI', 'VDA', 'DELLO', 'DELLA',
        'DEGLI', 'DELLE', 'VAN', 'VON', 'DER', 'DEN', 'HEER', 'TEN', 'TER',
        'VANDE', 'VANDEN', 'VANDER', 'VOOR', 'VER', 'AAN', 'MC', 'BEN', 'SAN',
        'SAINZ', 'BIN', 'LI', 'LE', 'DES', 'AM', 'AUS\'M', 'VOM', 'ZUM', 'ZUR', 'TEN', 'IBN'
    ]);

    const NON_NAME = new Set(['AKA', 'FKA', 'NKA', 'FICTITIOUS']);

    const CORP_ENTITY = new Set([
        'NA', 'CORP', 'CO', 'INC', 'ASSOCIATES', 'SERVICE', 'LLC', 'LLP', 'PARTNERS',
        'RA', 'CO', 'COUNTY', 'STATE',
        'BANK', 'GROUP', 'MUTUAL', 'FARGO'
    ]);

    const SUPPLEMENTAL_INFO = new Set(['WIFE OF', 'HUSBAND OF', 'SON OF', 'DAUGHTER OF', 'DECEASED']);

    const reUnwantedChars = /[\.,\/\\]/gi;
    const reConsecutiveSpaces = /\s{2,}/;

    function parse(name) {
        let modifiedName = name;
        let output = {
            fullName: name,

            salutation: null,
            firstName: null,
            middleName: null,
            lastName: null,
            generation: null,
            suffix: null,
            aliases: null,

            hasCorporateEntity: null,
            hasNonName: null,
            hasLnPrefix: null,
            hasSupplementalInfo: null
        };

        // Remove unwanted characters
        modifiedName = modifiedName.replace(reUnwantedChars, '');

        // Remove any consecutive spaces
        modifiedName = modifiedName.replace(reConsecutiveSpaces, ' ');

        // Split the name into parts
        let namePieces = modifiedName.split(' ');

        // Test each name piece
        let namePiecesIndex = 0;
        while (namePiecesIndex < namePieces.length) {
            let namePiece = namePieces[namePiecesIndex];
            let namePieceUpperCase = namePiece.toUpperCase();

            // Ignore these words
            if (namePiece.toLowerCase() === 'the') {
                namePieces.splice(namePiecesIndex, 1);
                continue;
            }

            // Salutation?
            if (output.salutation === null && SALUTATIONS.has(namePieceUpperCase)) {
                output.salutation = namePiece;
                namePieces.splice(namePiecesIndex, 1);
            }

            // Generation?
            if (output.generation === null && GENERATIONS.has(namePieceUpperCase)) {
                output.generation = namePiece;
                namePieces.splice(namePiecesIndex, 1);
            }

            // Suffix?
            if (output.suffix === null && SUFFIXES.has(namePieceUpperCase)) {
                output.suffix = namePiece;
                namePieces.splice(namePiecesIndex, 1);
            }

            // Has LN Prefix?
            if (output.hasLnPrefix !== true) {
                output.hasLnPrefix = LNPREFIXES.has(namePieceUpperCase) && namePiecesIndex !== 0;
                if (output.hasLnPrefix === true) {
                    namePieces[namePiecesIndex] += ' ' + namePieces[namePiecesIndex + 1];
                    namePieces.splice(namePiecesIndex + 1, 1);
                }
            }

            // Is a non-name piece?
            let namePieceIsNonName = false;
            if (namePiece.indexOf('\'') === 0 || namePiece.indexOf('"') === 0) {
                // TODO - Match only the correct apostrophe
                // TODO - Don't modify namePieces unless we know for sure we have a matching end apostrophe,
                //        otherwise we have another situation, not a non-name
                while (
                    !(
                        namePiece.substring(namePiece.length - 1) === '\'' ||
                        namePiece.substring(namePiece.length - 1) === '"'
                    )
                ) {
                    namePieces[namePiecesIndex] += ' ' + namePieces[namePiecesIndex + 1];
                    namePieces.splice(namePiecesIndex + 1, 1);
                    namePiece = namePieces[namePiecesIndex];
                }
                output.hasNonName = true;
                namePieceIsNonName = true;
                namePiece = namePiece.substring(1, namePiece.length - 1);
            } else if (NON_NAME.has(namePieceUpperCase)) {
                output.hasNonName = true;
                namePieceIsNonName = true;
                namePiece = namePieces[namePiecesIndex + 1];
                namePieces.splice(namePiecesIndex, 1);

                if (namePiece.toLowerCase() === 'the') {
                    namePieces[namePiecesIndex] += ' ' + namePieces[namePiecesIndex + 1];
                    namePieces.splice(namePiecesIndex + 1, 1);
                    namePiece = namePieces[namePiecesIndex];
                }
            } else if (output.hasNonName === null) {
                output.hasNonName = false;
            }

            if (namePieceIsNonName === true) {
                if (output.aliases === null) {
                    output.aliases = [];
                }

                output.aliases.push(namePiece);
                namePieces.splice(namePiecesIndex, 1);
            }

            // Has corporate entity?
            if (output.hasCorporateEntity !== true) {
                output.hasCorporateEntity = CORP_ENTITY.has(namePieceUpperCase);
            }

            // Has supplemental info?
            if (output.hasSupplementalInfo !== true) {
                output.hasSupplementalInfo = SUPPLEMENTAL_INFO.has(namePieceUpperCase);

                if (output.hasSupplementalInfo === true) {
                    namePieces.splice(namePiecesIndex, 1);
                }
            }

            // Increment index
            namePiecesIndex++;
        }

        // First Name
        output.firstName = namePieces[0]; // TODO - What if the array is empty?
        namePieces.splice(0, 1);

        // The rest
        if (namePieces.length > 1) {
            output.middleName = namePieces.splice(0, namePieces.length - 1).join(' ');
        }

        // Last Name
        output.lastName = namePieces[0];

        // Return parsed information
        return output;
    };

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = parse;
        module.exports.parse = parse;
    } else {
        // Save to either 'window' or 'global'
        root.NameParts = parse;
        root.NameParts.parse = parse;
    }
})(this);
