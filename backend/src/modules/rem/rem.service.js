export const sendToRem = async (clienteId) => {

    try {
        console.log(`Enviando cliente ${clienteId} a REM...`);
        return true;

    } catch (error) {
        console.error("Error enviando a REM:", error);
        throw new Error("Error en REM");
    }
};

export const sendSMSRem = async ({ telefono, canal }) => {

    console.log(`Enviando código vía ${canal} a ${telefono}`);

    return {
        success: true
    };
};

export const validateSMSRem = async ({ telefono, codigo }) => {

    console.log(`Validando código ${codigo} para ${telefono}`);

    if (codigo === "123456") {
        return { valid: true };
    }

    return { valid: false };
};