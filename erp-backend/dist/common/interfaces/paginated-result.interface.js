"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
function paginate(data, total, page, limit) {
    return {
        data,
        meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
}
//# sourceMappingURL=paginated-result.interface.js.map