"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMarketplaceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_marketplace_dto_1 = require("./create-marketplace.dto");
class UpdateMarketplaceDto extends (0, mapped_types_1.PartialType)(create_marketplace_dto_1.CreateMarketplaceDto) {
}
exports.UpdateMarketplaceDto = UpdateMarketplaceDto;
//# sourceMappingURL=update-marketplace.dto.js.map