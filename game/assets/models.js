import { OBJLoader } from "../libraries/three.js/examples/jsm/loaders/OBJLoader.js";

let objURL = [
    "./assets/board/new/mancala.obj",
    "./assets/raymanModel.obj", 
];

const vec3 = twgl.v3;
const mat4 = twgl.m4;
mat4.create = () =>
    new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

mat4.fromRotationTranslationScale = (q, v, s) => {
    // Quaternion math
    let x = q[0],
        y = q[1],
        z = q[2],
        w = q[3];
    let x2 = x + x;
    let y2 = y + y;
    let z2 = z + z;
    let xx = x * x2;
    let xy = x * y2;
    let xz = x * z2;
    let yy = y * y2;
    let yz = y * z2;
    let zz = z * z2;
    let wx = w * x2;
    let wy = w * y2;
    let wz = w * z2;
    let sx = s[0];
    let sy = s[1];
    let sz = s[2];
    let out = [];
    out[0] = (1 - (yy + zz)) * sx;
    out[1] = (xy + wz) * sx;
    out[2] = (xz - wy) * sx;
    out[3] = 0;
    out[4] = (xy - wz) * sy;
    out[5] = (1 - (xx + zz)) * sy;
    out[6] = (yz + wx) * sy;
    out[7] = 0;
    out[8] = (xz + wy) * sz;
    out[9] = (yz - wx) * sz;
    out[10] = (1 - (xx + yy)) * sz;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
};

function loadObject(url) {
    const loader = new OBJLoader();
    return new Promise(function (resolve, reject) {
        // instantiate a loader
        loader.load(
            // resource URL
            url,
            // called when resource is loaded
            function (object) {
                resolve(object);
            },
            // called when loading is in progresses
            function (xhr) {
                return (xhr.loaded / xhr.total) * 100 + "% loaded";
            },
            // called when loading has errors
            function (error) {
                reject("Error in loading");
            }
        );
    });
}

function createSCs(obj) {
    const sceneGraph = {};
    let scs = [];
    if (obj.scene) getNode(obj.scene, mat4.create());
    else getNode(obj, mat4.create());

    function getNode(node, M) {
        const sc = {};
        sc.name = node.name;

        const translation = node.position
            ? [node.position.x, node.position.y, node.position.z]
            : [0, 0, 0];
        const quaternion = node.quaternion
            ? [
                  node.quaternion.x,
                  node.quaternion.y,
                  node.quaternion.z,
                  node.quaternion.w,
              ]
            : [0, 0, 0, 1];
        //const rotation = node.rotation?[node.rotation.x,node.rotation.y,node.rotation.z]:[0,0,0];// XYZ order
        const scale =
            node.scale && node.scale.x
                ? [node.scale.x, node.scale.y, node.scale.z]
                : [1, 1, 1];

        sc.modelMatrix = mat4.multiply(
            M,
            mat4.fromRotationTranslationScale(quaternion, translation, scale)
        );

        if (node.geometry || node.attributes) {
            const attributes = node.geometry
                ? node.geometry.attributes
                : node.attributes;
            if (
                node.geometry &&
                node.geometry.groups &&
                node.geometry.groups.length > 0
            ) {
                const groups = node.geometry.groups;
                const localScs = d3.range(0, groups.length, 1).map((i) => {
                    /*
                return{
                  positions : array2Darray(attributes.position.array.slice(groups[i].start*3, (groups[i].start+groups[i].count)*3),3),
                  normals : array2Darray(attributes.normal.array.slice(groups[i].start*3, (groups[i].start+groups[i].count)*3),3),
                  uvs : array2Darray(attributes.uv.array.slice(groups[i].start*2, (groups[i].start+groups[i].count)*2),2)
                }
                */
                    return createSC(attributes, {
                        start: groups[i].start,
                        count: groups[i].count,
                    });
                });
                //return scs
                localScs.forEach((d, i) => {
                    //d.cells = d3.range(0,d.positions.length/3,1).map(i=>[i*3+0,i*3+1,i*3+2]);
                    scs.push({
                        name: sc.name,
                        sc: d,
                        modelMatrix: sc.modelMatrix,
                    });
                });
            } else {
                sc.sc = createSC(attributes);
                scs.push(sc);
            }
        }
        if (node.children)
            node.children.forEach((d) => getNode(d, sc.modelMatrix));
    }
    return scs;
}

function createSC(attributes, offset) {
    let positions = offset
        ? attributes.position.array.slice(
              offset.start * 3,
              (offset.start + offset.count) * 3
          )
        : attributes.position.array.slice();
    let normals = undefined,
        uvs = undefined;
    if (attributes.normal)
        normals = offset
            ? attributes.normal.array.slice(
                  offset.start * 3,
                  (offset.start + offset.count) * 3
              )
            : attributes.normal.array.slice();
    else {
        let count = positions.length / 3;
        let Ns = [];
        for (let i = 0; i < offset.count; i += 3) {
            const k = offset.start + i;
            const v0 = positions.slice(k * 9, k * 9 + 3),
                v1 = positions.slice(k * 9 + 3, k * 9 + 6),
                v2 = positions.slice(k * 9 + 6, k * 9 + 9);
            const N = Array.from(
                vec3.normalize(
                    vec3.cross(vec3.subtract(v1, v0), vec3.subtract(v2, v0))
                )
            );
            Ns.push(N, N, N);
        }
        normals = Ns.flat();
    }
    if (attributes.uv)
        uvs = offset
            ? attributes.uv.array.slice(
                  offset.start * 2,
                  (offset.start + offset.count) * 2
              )
            : attributes.uv.array.slice();
    return {
        positions,
        normals,
        uvs,
    };
}

function computeModelExtent(o) {
    const extents = o.map((d) => {
        const xExtent = d3.extent(d.sc.positions.filter((_, i) => i % 3 === 0));
        const yExtent = d3.extent(d.sc.positions.filter((_, i) => i % 3 === 1));
        const zExtent = d3.extent(d.sc.positions.filter((_, i) => i % 3 === 2));
        return {
            min: [xExtent[0], yExtent[0], zExtent[0]],
            max: [xExtent[1], yExtent[1], zExtent[1]],
        };
    });

    const transformedExtents = extents.map((extent, i) => {
        return o[i].modelMatrix
            ? {
                  min: mat4.transformPoint(o[i].modelMatrix, extent.min),
                  max: mat4.transformPoint(o[i].modelMatrix, extent.max),
              }
            : extent;
    });
    const xMin = d3.min(transformedExtents, (d) => d.min[0]);
    const xMax = d3.max(transformedExtents, (d) => d.max[0]);
    const yMin = d3.min(transformedExtents, (d) => d.min[1]);
    const yMax = d3.max(transformedExtents, (d) => d.max[1]);
    const zMin = d3.min(transformedExtents, (d) => d.min[2]);
    const zMax = d3.max(transformedExtents, (d) => d.max[2]);
    const min = [xMin, yMin, zMin],
        max = [xMax, yMax, zMax];
    const center = vec3.divScalar(vec3.add(min, max), 2); // center of AABB
    const dia = vec3.length(vec3.subtract(max, min)); // Diagonal length of the AABB
    return {
        min,
        max,
        center,
        dia,
    };
}

class Models {
    constructor() {
        this.objs = [];
        this.modelSCs = [];
        this.modelExtents = [];
        this.vertexAttributes = [];
    }

    async getModelData() {
        for await (const obj of objURL.map((url) => loadObject(url))) {
            let tmpSC = createSCs(obj);
            let tmpME = computeModelExtent(tmpSC);
            let tmpVA = tmpSC.map(d => ({
                position: { numComponents: 3, data: d.sc.positions },
                normal: { numComponents: 3, data: d.sc.normals },
                uv: { numComponents: 2, data: d.sc.uvs }
            }));


            
            let info = {
                obj: obj,
                modelSCs: tmpSC,
                modelExtents: tmpME,
                vertexAttributes: tmpVA
            }
            
            this.objs.push(info);
            // this.modelSCs.push(tmpSC);
            // this.modelExtents.push(tmpME);
            // this.vertexAttributes.push(tmpVA);

        }
    }
}

export { Models };
