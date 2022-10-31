const dependencies = ["pyyaml", "numpy", "networkx"];

// Load the pyodide interpreter and global dependencies
async function load_pyodide() {
  let pyodide = await loadPyodide();
  await pyodide.loadPackage(dependencies);
  return pyodide;
}
pyodideReadyPromise = load_pyodide();

// Load the example YAML file and set it in the "yaml" element
async function load_example() {
  let example = await fetch("example.yml");
  document.getElementById("yaml").value = await example.text();
}
exampleReadyPromise = load_example();

// Load functions from an accompanying Python module
async function load_python() {
  read_python = await fetch("lib.py").then((r) => r.text());
  return pyodideReadyPromise.then((p) => p.runPython(read_python));
}
pythonReadyPromise = load_python();

// On page load
async function main() {
  // Populate the example and validate it
  await exampleReadyPromise;
  await pythonReadyPromise;
  await validate(0);

  // Enable generation of cycles
  button = document.getElementById("button");
  button.disabled = false;
  button.textContent = "Generate";
}
main();

/*
 * Utility functions
 */

function debounce(fn) {
  var timer;
  return function (duration) {
    clearTimeout(timer);
    timer = setTimeout(fn, duration);
  };
}

/*
 * Functions that respond to user inputs
 */

async function load_yaml() {
  var file = document.getElementById("file").files[0];
  var reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = (evt) => {
    content = evt.target.result;
    yaml = document.getElementById("yaml");
    yaml.value = content;
    yaml.dispatchEvent(new Event("change"));
  };
}

// YAML validation is just
async function _validate() {
  let pyodide = await pyodideReadyPromise;
  pyodide.runPython(`
    import js
    import yaml
    textarea = js.document.getElementById("yaml")
    valid = js.document.getElementById("valid")
    try:
        config = yaml.safe_load(textarea.value)
        people = config["people"]
        partners = config.get("partners", [])
        cycles = config.get("cycles", {})

        assert isinstance(people, list)
        assert isinstance(partners, list)
        assert all(p1 in people and p2 in people for p1, p2 in partners)
        for year, cycle_list in cycles.items():
            assert all(set(cycle) <= set(people) for cycle in cycle_list)

        textarea.style.backgroundColor = "#ffffff";
        valid.textContent = "Valid!";
        valid.style.color = "green";
    except Exception as e:
        print(e)
        textarea.style.backgroundColor = "#ffeeee";
        valid.textContent = "Invalid!";
        valid.style.color = "red";
  `);
}
const validate = debounce(_validate);

async function compute() {
  let pyodide = await pyodideReadyPromise;
  pyodide.runPython(`
    cycles = config['cycles']
    years = sorted(cycles, reverse=True)
    penalty = float(js.document.getElementById("penalty").value)
    selection = select(config['people'], nx.Graph(config['partners']),
                       (cycles[year] for year in years),
                       penalty)
    result = format_selection(selection, config['people'])
    js.document.getElementById("result").value = result
  `);
}
