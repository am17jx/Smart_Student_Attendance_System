/**
 * Recursively converts all BigInt values in an object to strings so that
 * the result can be safely serialized with JSON.stringify.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const serializeBigInt = (obj: unknown): any => {
    return JSON.parse(
        JSON.stringify(obj, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value
        )
    );
};
