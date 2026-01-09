export const WIB_TIMEZONE = 'Asia/Jakarta';

export const toWIBLocalString = (isoString) => {
    if (!isoString) return '';
    
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleString('sv-SE', { 
        timeZone: WIB_TIMEZONE 
        }).replace(' ', 'T');
    } catch (error) {
        console.error('Error converting to WIB:', error);
        return '';
    }
};

export const fromLocalToWIBISO = (localString) => {
    if (!localString) return null;
    
    try {
        const date = new Date(localString);
        
        const wibDate = new Date(date.toLocaleString('en-US', { 
        timeZone: WIB_TIMEZONE 
        }));
        
        return wibDate.toISOString();
    } catch (error) {
        console.error('Error converting local to WIB ISO:', error);
        return null;
    }
};

export const formatWIBTime = (isoString) => {
    if (!isoString) return '';
    
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('id-ID', { 
        timeZone: WIB_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
        }) + ' WIB';
    } catch (error) {
        return '';
    }
};