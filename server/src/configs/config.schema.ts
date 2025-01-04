import * as yup from 'yup';

// ------------------------------------------- server -----------------------------------------------------

const serverConfigRule = yup.object().shape({
    logger: yup.boolean().required(),
    bodyLimit: yup.number().required(),
    caseSensitive: yup.boolean().required(),
    ignoreTrailingSlash: yup.boolean().required(),
    ignoreDuplicateSlashes: yup.boolean().required(),
    port: yup.number().required(),
    routePrefix: yup.string().required(),
    version: yup.string().required()
});

const payloadConfigRule = yup.object().shape({
    abortEarly: yup.boolean().required(),
    stripUnknown: yup.boolean().required(),
    recursive: yup.boolean().required(),
    decoratorKey: yup.string().required()
});

const multipartConfigRule = yup.object().shape({
    limits: yup.object().shape({
        fileSize: yup.number().required(),
        fieldSize: yup.number().required(),
        fields: yup.number().required(),
        files: yup.number().required()
    })
});

const authConfigRule = yup.object().shape({
    publicKey: yup.string().required(),
    encryptionKey: yup.string().required(),
    roleKey: yup.string().required(),
    jwt: yup.object().shape({
        secret: yup.string().required(),
        expiresIn: yup.string().required()
    })
});

const corsConfigRule = yup.object().shape({
    allowedDomains: yup.array().of(yup.string().trim().required()).required(),
    credentials: yup.boolean().required()
});

// ------------------------------------------- database -----------------------------------------------------

const sqlRule = yup.object().shape({
    host: yup
        .string()
        .required()
        .matches(/^localhost$|^([a-zA-Z0-9.-]+)$/, 'Invalid sql host format'),
    port: yup.number().required().min(1).max(65535).integer(),
    username: yup.string().required().min(1),
    password: yup.string().required().min(1),
    database: yup.string().required().min(1),
    connectionLimit: yup.number().default(10),
    seedDatabase: yup.boolean().default(false)
});

const databaseRule = yup.object().shape({ sql: sqlRule });

// ----------------------------------------------------------------------------------------------------------

export const AppConfigRule = yup.object().shape({
    server: serverConfigRule,
    cors: corsConfigRule,
    auth: authConfigRule,
    payloadValidation: payloadConfigRule,
    multiPart: multipartConfigRule,
    database: databaseRule
});

// ------------------------------------------------------------------------------------------------------------------

export type AppConfig = yup.InferType<typeof AppConfigRule>;

// ------------------------------------------------------------------------------------------------------------------
