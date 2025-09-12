export const validateDates = (startDate, endDate) => {
    if (!startDate) return { valid: false, error: "Tanggal mulai wajib diisi." };
    if (endDate && new Date(endDate) <= new Date(startDate)) {
        return { valid: false, error: "Tanggal selesai harus setelah tanggal mulai." };
    }
    return { valid: true };
};

export const validateImageFile = (file) => {
    if (!file) return { valid: false, error: "Harap pilih file gambar." };
    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) return { valid: false, error: "Harap unggah file JPEG atau PNG." };
    if (file.size > 5 * 1024 * 1024) return { valid: false, error: "Ukuran file maksimum 5MB." };
    return { valid: true };
};