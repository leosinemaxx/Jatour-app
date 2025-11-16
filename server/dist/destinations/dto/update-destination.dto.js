"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDestinationDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_destination_dto_1 = require("./create-destination.dto");
class UpdateDestinationDto extends (0, mapped_types_1.PartialType)(create_destination_dto_1.CreateDestinationDto) {
}
exports.UpdateDestinationDto = UpdateDestinationDto;
//# sourceMappingURL=update-destination.dto.js.map