import { bench, describe } from "vitest";
import { address, arg, array, Codec, Sink, Src, struct, uint256 } from "../index";
import { decodeAbiParameters, encodeAbiParameters } from "viem";
import { ethers } from "ethers";

const hugeArray = Array.from({ length: 10 }, (_, i) => BigInt(i));

class InlinedStructCodec<
  S extends {
    a: bigint[];
    b: bigint;
    c: {
      d: bigint[];
      e: string;
    };
  }
> implements Codec<S>
{
  isDynamic = true;
  public encode(sink: Sink, val: S): void {
    sink.offset();
    const tempSink = new Sink(3);
    array(uint256).encode(tempSink, val.a);
    uint256.encode(tempSink, val.b);
    sink.offset();
    const tempSink2 = new Sink(2);
    array(uint256).encode(tempSink2, val.c.d);
    address.encode(tempSink2, val.c.e);
    tempSink.append(tempSink2);
    tempSink.jumpBack();
    sink.append(tempSink);
    sink.jumpBack();
  }

  public decode(src: Src): S {
    const offset = src.u32();
    // const tmpSrc = src.slice(offset);
    src.pushSlice(offset);
    const decoded_0 = uint256_array.decode(src);
    const decoded_1 = uint256.decode(src);
    const offset2 = src.u32();
    src.pushSlice(offset2)
    // const tmpSrc2 = tmpSrc.slice(offset2);
    const decoded2_0 = uint256_array.decode(src);
    const decoded2_1 = address.decode(src);
    src.popSlice()
    src.popSlice()
    return {
      a: decoded_0,
      b: decoded_1,
      c: {
        d: decoded2_0,
        e: decoded2_1,
      },
    } as S;
  }
}

const uint256_array = array(uint256);

const s = struct(
  arg("a", array(uint256)),
  arg("b", uint256),
  arg("c", struct(arg("d", array(uint256)), arg("e", address)))
);
const inlined = new InlinedStructCodec();

// describe("StructCodec - encoding", () => {
//   bench("encoding dynamic tuple", () => {
//     const sink1 = new Sink(1);
//
//     s.encode(sink1, {
//       a: hugeArray,
//       b: 2n,
//       c: {
//         d: hugeArray,
//         e: "0x1234567890123456789012345678901234567890",
//       },
//     });
//   });
//
//   bench("inlined - encoding dynamic tuple", () => {
//     const sink2 = new Sink(1);
//     inlined.encode(sink2, {
//       a: hugeArray,
//       b: 2n,
//       c: {
//         d: hugeArray,
//         e: "0x1234567890123456789012345678901234567890",
//       },
//     });
//   });
//
//   bench("viem - encoding dynamic tuple", () => {
//     encodeAbiParameters(
//       [
//         {
//           type: "tuple",
//           components: [
//             { name: "a", type: "uint256[]" },
//             { name: "b", type: "uint256" },
//             {
//               name: "c",
//               type: "tuple",
//               components: [
//                 { name: "d", type: "uint256[]" },
//                 { name: "e", type: "address" },
//               ],
//             },
//           ],
//         },
//       ],
//       [
//         {
//           a: hugeArray,
//           b: 2n,
//           c: {
//             d: hugeArray,
//             e: "0x1234567890123456789012345678901234567890",
//           },
//         },
//       ]
//     );
//   });
//
//   bench("ethers - encoding dynamic tuple", () => {
//     ethers.utils.defaultAbiCoder.encode(
//       ["tuple(uint256[] a,uint256 b,tuple(uint256[] d,address e) c)"],
//       [
//         {
//           a: hugeArray,
//           b: 2n,
//           c: {
//             d: hugeArray,
//             e: "0x1234567890123456789012345678901234567890",
//           },
//         },
//       ]
//     );
//   });
// });

describe("StructCodec - decoding", () => {
  const sink = new Sink(1);
  s.encode(sink, {
    a: hugeArray,
    b: 2n,
    c: {
      d: hugeArray,
      e: "0x1234567890123456789012345678901234567890",
    },
  });

  const src = new Src(sink.result());

  bench("decoding dynamic tuple", () => {
    src.setPosition(0);
    s.decode(src);
  });

  bench("inlined - decoding dynamic tuple", () => {
    src.setPosition(0);
    inlined.decode(src);
  });

  // bench("viem - decoding dynamic tuple", () => {
  //   decodeAbiParameters(
  //     [
  //       {
  //         type: "tuple",
  //         components: [
  //           { name: "a", type: "uint256[]" },
  //           { name: "b", type: "uint256" },
  //           {
  //             name: "c",
  //             type: "tuple",
  //             components: [
  //               { name: "d", type: "uint256[]" },
  //               { name: "e", type: "address" },
  //             ],
  //           },
  //         ],
  //       },
  //     ],
  //     sink.result()
  //   );
  // });
  //
  // bench("ethers - decoding dynamic tuple", () => {
  //   ethers.utils.defaultAbiCoder.decode(
  //     ["tuple(uint256[] a,uint256 b,tuple(uint256[] d,address e) c)"],
  //     sink.result()
  //   );
  // });
});
