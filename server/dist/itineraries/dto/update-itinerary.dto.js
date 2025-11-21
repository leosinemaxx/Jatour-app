"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateItineraryDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_itinerary_dto_1 = require("./create-itinerary.dto");
class UpdateItineraryDto extends (0, mapped_types_1.PartialType)(create_itinerary_dto_1.CreateItineraryDto) {
}
exports.UpdateItineraryDto = UpdateItineraryDto;
//# sourceMappingURL=update-itinerary.dto.js.map