

export const IS_METHOD_CALL = /\w+\(.*?\)/;

export const METHOD_CALL = /(\w+)\((.*?)\)/;

export const IS_JSON = /^[\],:{}\s]*$|^"([^\\"]|\\["\\bfnrt\/]|\\u[\da-fA-F]{4})*"(?=[\],:{}\s]*$)|^'([^\\']|\\['\\bfnrt\/]|\\u[\da-fA-F]{4})*'(?=[\],:{}\s]*$)|^\d+\.\d+(?=\s*[\],:{}])|^0$|^-?\d+(?=\s*[\],:{}])|^true(?=\s*[\],:{}])|^false(?=\s*[\],:{}])|^null(?=\s*[\],:{}])|^(?!")(?!')(?!.*\\["\\]).*[^\\]$/;

export const NUMERIC = /^-?\d+(\.\d+)?$/;