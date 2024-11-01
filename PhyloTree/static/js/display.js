const highlightNodes = ["SyntheticMDH_223_66", "SyntheticMDH_134_38", "SyntheticMDH_1011_77", 
                        "SyntheticMDH_647_53", "NP_417703", "yntheticMDH_459_62", "CAB97430", 
                        "CCE24885"];
const alignmentRectSize = 10;

let treeData = [],
    alignmentData = [],
    targetID_tree = 'tree_canvas',
    targetEle_tree,
    targetSVG_tree,
    targetID_align = 'alignment_canvas',
    targetEle_align,
    targetSVG_align,
    phyloTreeG,
    alignmentG,
    width_tree,
    height_tree,
    width_align,
    height_align,
    margin_tree = {l:0, r:0, t:0, b:0}
    margin_align = {l:0, r:0, t:0, b:0}
    alignment_xScale = d3.scaleBand(),
    alignment_colorScale = d3.scaleOrdinal(d3.schemeSet3);

let root,
    treeLayout;

init();

function init() {
    let totalWidth, totalHeight;

    targetEle_tree = d3.select(`#${targetID_tree}`);
    totalWidth = targetEle_tree.node().getBoundingClientRect().width;
    totalHeight = targetEle_tree.node().getBoundingClientRect().height;
    margin_tree = {  
                l:totalWidth*0.01, 
                r:totalWidth*0.01, 
                t:totalHeight*0.02, 
                b:totalHeight*0.02
            };
    width_tree = totalWidth-margin_tree.l-margin_tree.r;
    height_tree = totalHeight-margin_tree.t-margin_tree.b;

    targetSVG_tree = targetEle_tree.append("svg")
                    .attr("width", totalWidth)
                    .attr("height", totalHeight);

    phyloTreeG = targetSVG_tree.append("g")
                    .attr("class", "PhyloTree")
                    .attr("transform", `translate(${margin_tree.l},${margin_tree.t})`);

    targetEle_align = d3.select(`#${targetID_align}`);
    totalWidth = targetEle_align.node().getBoundingClientRect().width;
    totalHeight = targetEle_align.node().getBoundingClientRect().height;
    margin_align = {  
                l:totalWidth*0.01, 
                r:totalWidth*0.01, 
                t:totalHeight*0.02, 
                b:totalHeight*0.02
            };
    width_align = totalWidth-margin_align.l-margin_align.r;
    height_align = totalHeight-margin_align.t-margin_align.b;

    targetSVG_align = targetEle_align.append("svg")
                        .attr("width", totalWidth)
                        .attr("height", totalHeight);

    alignmentG = targetSVG_align.append("g")
                    .attr("class", "AlignmentView")
                    .attr("transform", `translate(${margin_align.l},${margin_align.t})`);

    treeLayout = d3.cluster().size([height_tree, width_tree - 120])
}

function parseNewick(a){
    for(var e=[],r={},s=a.split(/\s*(;|\(|\)|,|:)\s*/),t=0;t<s.length;t++){
        var n=s[t];
        switch(n){
            case"(":
                var c={};
                r.children=[c],e.push(r),r=c;
                break;
            case",":
                var c={};
                e[e.length-1].children.push(c),r=c;
                break;
            case")":
                r=e.pop();
                break;
            case":":
                break;
            default:
                var h=s[t-1];
                ")"==h||"("==h||"," == h ? r.name=n : ":"==h&&(r.length=parseFloat(n))    
        }
    }
    return r;
}

d3.select("#treeFile").on("change", function () {
    var f = event.target.files[0]
    var reader = new FileReader();

    reader.onload = function(event) {
        load_tree(event.target.result)
    };
    // Read in the file as a data URL.
    reader.readAsDataURL(f);
})

function load_tree(fileHandler) {
    d3.text(fileHandler).then(d =>{
        treeData = parseNewick(d);
        displayTree();

        displayAlignnment();
    });
}

function line(d) {
    return "M" + d.source.y + "," + d.source.x
        + "L" + d.source.y + "," + d.target.x
        + " " + d.target.y + "," + d.target.x;
}

function displayTree() {

    root = d3.hierarchy(treeData);
    treeLayout(root);
    phyloTreeG.selectAll(".link")
        .data(root.links())
        .join("path")
            .attr("class", "link")
            .attr("d", line);

    const node = phyloTreeG.selectAll(".node")
                    .data(root.descendants())
                    .join("g")
                        .attr("class", "node")
                        .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
    .attr("r", d => d.children ? 1 : 0);

    node.append("text")
        .attr("dy", 3)
        .attr("class", d => highlightNodes.includes(d.data.name) ? "nodeText highlightNode" : "nodeText")
        .attr("x", d => d.children ? -8 : 4)
        .text(d => d.children ? "" : d.data.name);
}

function displayAlignnment() {
    $.ajax({
        type:'POST',
        url:'getAlignmentData',
        data:{},
        success: function(response) {
            alignmentData = JSON.parse(response.data);
            updateAlignmentView();
        },
        error: function(response) {
            console.log(response);
        }
    });
}

function updateAlignmentView() {
    let phyloTreeViewWidth = phyloTreeG.node().getBoundingClientRect().width,
        alignmentDataSeqSize = Object.values(alignmentData)[0].length,
        width_align = alignmentDataSeqSize*alignmentRectSize;

    targetSVG_align.attr("width", width_align);  

    alignmentG.attr("transform", `translate(${margin_align.l + phyloTreeViewWidth},${margin_align.t})`);
    alignment_xScale.domain(Array.from(Array(alignmentDataSeqSize).keys())).range([0,width_align]);

    alignmentG.selectAll(".align_ele")
        .data(root.leaves())
        .enter().append("g")
            .attr("class", "align_ele")
            .attr("transform", d => {
                console.log(d.data.name, d)
                return `translate(0,${d.x - alignmentRectSize/2})`;
            });

    alignmentG.selectAll(".align_ele").each(function(d,j) {
        d3.select(this).append("g")
            .selectAll(`.rect_${d.data.name}`)
                .data(alignmentData[d.data.name])
                .join("rect")
                    .attr("class", `rect_${d.data.name} `)
                    .attr("x", (k,i) => alignment_xScale(i))
                    .attr("width", alignment_xScale.bandwidth())
                    .attr("height", alignmentRectSize)
                    .attr("fill", k => k=="-"? "#fff" : alignment_colorScale(k));

        d3.select(this).append("g")
            .selectAll(`.ltrs_${d.data.name}`)
                .data(alignmentData[d.data.name])
                .join("text")
                    .attr("dy", ".31em")
                    .attr("class", `ltrs_${d.data.name} alignment_seq`)
                    .attr("x", (k,i) => alignment_xScale(i)+alignment_xScale.bandwidth()/2)
                    .attr("y", 5)
                    .text(k => k);
    })
}