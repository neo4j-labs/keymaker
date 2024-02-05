const containsNoSpaces = (str) => {
  if (typeof str === "string" && str.indexOf(" ") === -1) {
    return true;
  }
  return false;
};

const notNullUndefinedOrEmpty = (input) => {
  if (input) {
    return true;
  }
  return false;
};

const arrayHasElements = (input) => {
  if (Array.isArray(input) && input.length > 0) {
    return true;
  }
  return false;
};

const isPositiveInteger = (input) => {
  if (typeof input === "number" && input >= 0) {
    return true;
  }
  return false;
};

const pluralize = (count, noun, suffix = "s") => {
  return `${count} ${noun}${count !== 1 ? suffix : ""}`;
};

const stringStartsWith = (s1, s2) => {
  s1 = s1 || '';
  s2 = s2 || '';
  s1 = s1.toLowerCase().replace(/\s/g, "");
  s2 = s2.toLowerCase().replace(/\s/g, "");
  if (s2.startsWith(s1)) {
    return true;
  }
  return false;
};

const safelyUnwrap = (data, properties, nullReturnValue) => {
  var result = data;
  properties.forEach((prop) => {
    if (result[prop]) {
      result = result[prop];
    } else {
      result = nullReturnValue;
      return;
    }
  });
  return result;
};

/*
  args: [{input: any, functions: [func], onError: func}]
  note: functions within the functions array should return true if the input 
        is valid and false if it is not
*/
// TODO: refactor!! If the function that throws an error isn't the last function run this will still return true
// TODO: refactor!! Consider changing to checkInput()
const checkInputs = (inputs) => {
  var result = true;
  inputs.forEach((input) => {
    input.functions.forEach((func) => {
      if (!func(input.input)) {
        result = false;
        input.onError();
      }
    });
  });
  return result;
};

const runMutation = async (
  mutation,
  variables,
  refetchQueries = [],
  onError = () => {},
  onSuccess = () => {},
  updateCache = () => {}
) => {
  let success = true;
  const result = await mutation({
    variables: variables,
    refetchQueries: refetchQueries,
    update: (store, { data }) => {
      try {
        updateCache(store, data);
      } catch (err) {
        console.log(err);
      }
    },
  }).catch((error) => {
    onError(error);
    success = false;
  });
  if (success) {
    onSuccess(result);
  }
};

const parseDBInfo = (info) => {
  if (!info) {
    return { color: "#d84242", message: "Offline", icon: "times circle" };
  }
  if (!info.isConnected) {
    return { color: "#d84242", message: "Offline", icon: "times circle" };
  } else if (info.license !== "ENTERPRISE") {
    return {
      color: "#ebd000",
      message: "Update to Enterprise",
      icon: "dot circle",
    };
  } else if (!info.hasApoc) {
    return { color: "#ebd000", message: "Install APOC", icon: "dot circle" };
  } else {
    return { color: "#63b344", message: "Online", icon: "check circle" };
  }
};

export {
  parseDBInfo,
  runMutation,
  checkInputs,
  pluralize,
  safelyUnwrap,
  arrayHasElements,
  notNullUndefinedOrEmpty,
  containsNoSpaces,
  isPositiveInteger,
  stringStartsWith,
};
