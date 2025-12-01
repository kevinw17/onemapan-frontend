export const isNationalRole = (role) => {
    if (!role) return false;
    const normalized = role.toString().toLowerCase().replace(/\s+/g, "");
    return ["superadmin", "ketualembaga", "sekjenlembaga"].includes(normalized);
};

export const isSuperAdminLike = (role) => {
    return isNationalRole(role);
};