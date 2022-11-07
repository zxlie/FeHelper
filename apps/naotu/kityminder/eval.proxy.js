window.eval = function(code) {
    evalCore.getEvalInstance(window)(code)
};
