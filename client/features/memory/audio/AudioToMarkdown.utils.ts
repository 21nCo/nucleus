import { prefixTable } from "@21n/shared-utils/text.utils";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import {
  HeadingKeys,
  InlineKeys,
  ListKeys,
  type A2MDBlock,
  BlockKeys
} from "@nucleum/features/memory/audio/AudioToMarkdown.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import { generateRandomIdv2 } from "@21n/shared-utils/crypto.utils";
import { reparse } from "@21n/shared-utils/json.utils";
class AudioToMarkdown {
  words: string[] | undefined;
  word: string | undefined;

  readonly simpleTextCase: string[] = [BlockKeys.SIMPLE_TEXT];
  readonly quoteCase = [BlockKeys.QUOTE, "quotes"];
  readonly dividerCase: string[] = [BlockKeys.DIVIDER];
  readonly doubleDividerCase: string[] = [BlockKeys.DOUBLE_DIVIDER];

  readonly h1Case = [HeadingKeys.H1, "hone", "heading1", "headingone"];
  readonly h2Case = [HeadingKeys.H2, "htwo", "heading2", "headingtwo"];
  readonly h3Case = [HeadingKeys.H3, "hthree", "heading3", "headingthree"];
  readonly h4Case = [HeadingKeys.H4, "hfour", "heading4", "headingfour"];
  readonly h5Case = [HeadingKeys.H5, "hfive", "heading5", "headingfive"];
  readonly h6Case = [HeadingKeys.H6, "hsix", "heading6", "headingsix"];

  readonly headingCase = [
    ...this.h1Case,
    ...this.h2Case,
    ...this.h3Case,
    ...this.h4Case,
    ...this.h5Case,
    ...this.h6Case
  ];
  readonly olCase = [ListKeys.OL, "orderedlist", "orderlist"];
  readonly ulCase = [ListKeys.UL, "unorderedlist", "bullet"];
  readonly olChildCase = [
    ListKeys.OL_CHILD,
    "orderedlistchild",
    "orderlistchild"
  ];
  readonly ulChildCase = [
    ListKeys.UL_CHILD,
    "unorderedlistchild",
    "bulletchild"
  ];
  readonly olSubChildCase = [
    ListKeys.OL_SUB_CHILD,
    "orderedlistsubchild",
    "orderlistsubchild"
  ];
  readonly ulSubChildCase = [
    ListKeys.UL_SUB_CHILD,
    "unorderedlistsubchild",
    "bulletsubchild"
  ];
  readonly olSubSubChildCase = [
    ListKeys.OL_SUB_SUB_CHILD,
    "orderedlistsubsubchild",
    "orderlistsubsubchild"
  ];
  readonly ulSubSubChildCase = [
    ListKeys.UL_SUB_SUB_CHILD,
    "unorderedlistsubsubchild",
    "bulletsubsubchild"
  ];
  readonly italicCase = [InlineKeys.ITALIC, "italicstop"];
  readonly boldCase = [InlineKeys.BOLD, "boldstop"];

  /**
   * TODO: Stop cases like h1StopCase and others similar items having suffix as stopCase can be commented out if felt not required and use only blankStopCase or remove stopCase altogether since we have keywords for all blocks including simpletext. And inline cases also has the same start keyword as end keyword is just provided additionally ${inlineShorthand}Stop
   */
  readonly simpleTextStopCase = ["simpletextstop"];
  readonly quoteStopCase = ["quotestop"];
  readonly h1StopCase = [
    "h1stop",
    "honestop",
    "heading1stop",
    "headingonestop"
  ];
  readonly h2StopCase = [
    "h2stop",
    "htwostop",
    "heading2stop",
    "headingtwostop"
  ];
  readonly h3StopCase = [
    "h3stop",
    "hthreestop",
    "heading3stop",
    "headingthreestop"
  ];
  readonly h4StopCase = [
    "h4stop",
    "hfourstop",
    "heading4stop",
    "headingfourstop"
  ];
  readonly h5StopCase = [
    "h5stop",
    "hfivestop",
    "heading5stop",
    "headingfivestop"
  ];
  readonly h6StopCase = [
    "h6stop",
    "hsixstop",
    "heading6stop",
    "headingsixstop"
  ];
  readonly todoCase = ["todo"];
  readonly todoChildCase = ["todochild"];
  readonly todoSubChildCase = ["todosubchild"];
  readonly olStopCase = ["olstop", "orderedliststop"];
  readonly ulStopCase = ["ulstop", "unorderedliststop", "bulletstop"];
  readonly olChildStopCase = ["olchildstop", "orderedlistchildstop"];
  readonly ulChildStopCase = [
    "ulchildstop",
    "unorderedlistchildstop",
    "bulletchildstop"
  ];
  readonly olSubChildStopCase = ["olsubchildstop", "orderedlistsubchildstop"];
  readonly ulSubChildStopCase = [
    "ulsubchildstop",
    "unorderedlistsubchildstop",
    "bulletsubchildstop"
  ];
  readonly olSubSubChildStopCase = [
    "olsubsubchildstop",
    "orderedlistsubsubchildstop"
  ];
  readonly ulSubSubChildStopCase = [
    "ulsubsubchildstop",
    "unorderedlistsubsubchildstop",
    "bulletsubsubchildstop"
  ];

  readonly stopCase = ["blankstop"];
  /**
   * Stop keywords are used to indicate that the current block should be pushed to the blocks array and the current block should be reset to the default block
   * All stop keywords are also included in the keywords array
   * Any new stopCase created should be added here
   */
  readonly stopKeywords = [
    ...this.h1StopCase,
    ...this.h2StopCase,
    ...this.h3StopCase,
    ...this.h4StopCase,
    ...this.h5StopCase,
    ...this.h6StopCase,
    ...this.olStopCase,
    ...this.ulStopCase,
    ...this.olChildStopCase,
    ...this.ulChildStopCase,
    ...this.olSubChildStopCase,
    ...this.ulSubChildStopCase,
    ...this.olSubSubChildStopCase,
    ...this.ulSubSubChildStopCase,
    ...this.quoteStopCase,
    ...this.simpleTextStopCase,
    ...this.stopCase
  ];
  /**
   * keywords are used to identify the keywords in the transcript
   * Any new keywords created should be added here esepcially if the keyword is a combination of more than one word
   */
  readonly keywords = [
    ...this.headingCase,
    ...this.todoCase,
    ...this.todoChildCase,
    ...this.todoSubChildCase,
    ...this.olCase,
    ...this.ulCase,
    ...this.olChildCase,
    ...this.ulChildCase,
    ...this.olSubChildCase,
    ...this.ulSubChildCase,
    ...this.olSubSubChildCase,
    ...this.ulSubSubChildCase,
    ...this.quoteCase,
    ...this.dividerCase,
    ...this.doubleDividerCase,
    ...this.simpleTextCase,
    ...this.italicCase,
    ...this.boldCase,
    ...this.stopKeywords
  ];

  blocks: A2MDBlock[] = [];
  defaultBlock: A2MDBlock = { body: "", contentType: "SIMPLE_TEXT" };
  // defaultListBlockValues: A2MDBlock = {
  //   body: {},
  //   contentType: "LIST",
  //   children: []
  // };
  lastCreatedOL: any = null;
  lastCreatedUL: any = null;
  lastCreatedOLchild: any = null;
  lastCreatedOLsubchild: any = null;
  lastCreatedULchild: any = null;
  lastCreatedULsubchild: any = null;
  lastCreatedListVariant: ListKeys | null = null;
  currentBlock = { ...this.defaultBlock };
  OLOrder: any = {
    order: 0,
    childOrder: 0,
    subChildOrder: 0
  };
  ULOrder: number = 0;
  todoOrder: number = 0;

  reetOrders() {
    this.resetOLOrders();
    this.ULOrder = 0;
    this.todoOrder = 0;
  }
  resetOLOrders(
    neglectItem: "order" | "childOrder" | "subChildOrder" | "" = ""
  ) {
    const keys = Object.keys(this.OLOrder).reverse();
    for (const key of keys) {
      if (this.OLOrder.hasOwnProperty(key) && key != neglectItem) {
        this.OLOrder[key] = 0;
      } else break;
    }
  }
  resetInitialStates() {
    this.lastCreatedOL = null;
    this.lastCreatedUL = null;
    this.lastCreatedOLchild = null;
    this.lastCreatedOLsubchild = null;
    this.lastCreatedULchild = null;
    this.lastCreatedULsubchild = null;
    this.lastCreatedListVariant = null;
    this.currentBlock = { ...this.defaultBlock };
    this.blocks = [];
  }
  /**
   * Used to initialize all list blocks
   * @param indent
   */
  initializeListBlock(
    indent: number,
    type: NodeType.LIST | NodeType.ORDERED_LIST | NodeType.CHECKLIST,
    level: 0 | 1 | 2 = 0
  ) {
    let orderValue;
    this.pushCurrentBlockToBlocks();
    if (type == NodeType.ORDERED_LIST) {
      switch (level) {
        case 0:
          this.resetOLOrders("order");
          orderValue = ++this.OLOrder.order;
          break;
        case 1:
          this.resetOLOrders("childOrder");
          orderValue = ++this.OLOrder.childOrder;
          break;
        case 2:
          this.resetOLOrders("subChildOrder");
          orderValue = ++this.OLOrder.subChildOrder;
          break;
      }
      this.ULOrder = 0;
      this.todoOrder = 0;
      this.currentBlock.contentType = NodeType.ORDERED_LIST;
    } else if (type == NodeType.LIST) {
      orderValue = ++this.ULOrder;
      this.resetOLOrders();
      this.todoOrder = 0;
      this.currentBlock.contentType = NodeType.LIST;
    } else {
      orderValue = ++this.todoOrder;
      this.resetOLOrders();
      this.ULOrder = 0;
      this.currentBlock.contentType = NodeType.CHECKLIST;
    }
    this.currentBlock.id = prefixTable(generateRandomIdv2(), Resource.node);
    this.currentBlock.body = {
      indent: indent,
      text: "",
      order: orderValue
    };
  }

  /**
   * Replaces patterns like * string * with *string* and ** string ** with **string**
   * @param input - input string
   * @returns output - output string
   */
  removeSpacesBetweenAsterisks(input: string): string {
    input = input.replace(/\*\s+([^\*]+?)\s+\*/g, "*$1*");
    const output = input.replace(/\*\*\s+([^\*]+?)\s+\*\*/g, "**$1**");
    return output;
  }
  pushToAvailableULParent() {
    if (this.lastCreatedULsubchild != null)
      this.lastCreatedULsubchild.children.push(this.currentBlock);
    else if (this.lastCreatedULchild != null)
      this.lastCreatedULchild.children.push(this.currentBlock);
    else if (this.lastCreatedUL != null)
      this.lastCreatedUL.children.push(this.currentBlock);
    else this.blocks.push(this.currentBlock);
  }
  pushToAvailableOLParent() {
    if (this.lastCreatedOLsubchild != null)
      this.lastCreatedOLsubchild.children.push(this.currentBlock);
    else if (this.lastCreatedOLchild != null)
      this.lastCreatedOLchild.children.push(this.currentBlock);
    else if (this.lastCreatedOL != null)
      this.lastCreatedOL.children.push(this.currentBlock);
    else this.blocks.push(this.currentBlock);
  }

  // pushCurrentBlockToBlocks() {
  //   if (this.currentBlock.body && this.currentBlock.body.length > 0) {
  //     this.currentBlock.body = this.removeSpacesBetweenAsterisks(
  //       this.currentBlock.body
  //     );
  //     if (this.currentBlock.contentType === "LIST") {
  //       switch (this.lastCreatedListVariant) {
  //         case ListKeys.OL:
  //           this.blocks.push(this.lastCreatedOL);
  //           break;
  //         case ListKeys.UL:
  //           this.blocks.push(this.lastCreatedUL);
  //           break;
  //         case ListKeys.OL_CHILD:
  //           if (this.lastCreatedOL == null) {
  //             this.lastCreatedOLchild = null;
  //             this.pushToAvailableOLParent();
  //           } else this.lastCreatedOL.children.push(this.currentBlock);
  //           break;
  //         case ListKeys.UL_CHILD:
  //           if (this.lastCreatedUL == null) {
  //             this.lastCreatedULchild = null;
  //             this.pushToAvailableULParent();
  //           } else this.lastCreatedUL.children.push(this.currentBlock);
  //           break;
  //         case ListKeys.OL_SUB_CHILD:
  //           if (this.lastCreatedOLchild == null) {
  //             this.lastCreatedOLsubchild = null;
  //             this.pushToAvailableOLParent();
  //           } else this.lastCreatedOLchild.children.push(this.currentBlock);
  //           break;
  //         case ListKeys.UL_SUB_CHILD:
  //           if (this.lastCreatedULchild == null) {
  //             this.lastCreatedULsubchild = null;
  //             this.pushToAvailableULParent();
  //           } else this.lastCreatedULchild.children.push(this.currentBlock);
  //           break;
  //         case ListKeys.OL_SUB_SUB_CHILD:
  //           if (this.lastCreatedOLsubchild == null)
  //             this.pushToAvailableOLParent();
  //           else this.lastCreatedOLsubchild.children.push(this.currentBlock);
  //           break;
  //         case ListKeys.UL_SUB_SUB_CHILD:
  //           if (this.lastCreatedULsubchild == null)
  //             this.pushToAvailableULParent();
  //           else this.lastCreatedULsubchild.children.push(this.currentBlock);
  //           break;
  //       }
  //     } else {
  //       this.currentBlock.id = prefixTable(generateUID(), Resource.node);
  //       this.blocks.push(this.currentBlock);
  //     }
  //   } else if (
  //     this.currentBlock.contentType === NodeType.DIVIDER ||
  //     this.currentBlock.contentType === NodeType.DOUBLE_DIVIDER
  //   ) {
  //     this.blocks.push(this.currentBlock);
  //   }
  //   this.currentBlock = { ...this.defaultBlock };
  // }
  pushCurrentBlockToBlocks() {
    if (
      this.currentBlock.contentType === NodeType.DIVIDER ||
      this.currentBlock.contentType === NodeType.DOUBLE_DIVIDER
    ) {
      this.blocks.push(this.currentBlock);
    } else {
      if (typeof this.currentBlock.body == "object")
        this.currentBlock.body.text = this.removeSpacesBetweenAsterisks(
          this.currentBlock.body.text
        );
      else if (typeof this.currentBlock.body == "string")
        this.currentBlock.body = this.removeSpacesBetweenAsterisks(
          this.currentBlock.body
        );

      this.currentBlock.id = prefixTable(generateRandomIdv2(), Resource.node);
      this.blocks.push(this.currentBlock);
    }
    this.currentBlock = { ...this.defaultBlock };
  }
  checkForKeywords(
    c0: string,
    c1: string,
    c2: string,
    c3: string,
    c4: string
  ): [string, number] {
    if (this.keywords.includes(c4)) return [c4, 4];
    else if (this.keywords.includes(c3)) return [c3, 3];
    else if (this.keywords.includes(c2)) return [c2, 2];
    else if (this.keywords.includes(c1)) return [c1, 1];
    else return [c0, 0];
  }

  resolveHeadingContentType(keyword: string): string {
    switch (true) {
      case this.h1Case.includes(keyword):
        return NodeType.HEADING1;
      case this.h2Case.includes(keyword):
        return NodeType.HEADING2;
      case this.h3Case.includes(keyword):
        return NodeType.HEADING3;
      case this.h4Case.includes(keyword):
        return NodeType.HEADING4;
      case this.h5Case.includes(keyword):
        return NodeType.HEADING5;
      //TODO- add H6 once implemented in markdown
      default:
        return NodeType.SIMPLE_TEXT;
    }
  }

  loopThroughAndDecode(words: string[]) {
    let currentWord: string = "";
    for (let i = 0; i < words.length; i++) {
      const casePreservedWord = words[i];
      const combined2 = words[i] + words[i + 1];
      const combined3 = combined2 + words[i + 2];
      const combined4 = combined3 + words[i + 3];
      const combined5 = combined4 + words[i + 4];
      let add = 0;
      [currentWord, add] = this.checkForKeywords(
        words[i].toLowerCase(),
        combined2.toLowerCase(),
        combined3.toLowerCase(),
        combined4.toLowerCase(),
        combined5.toLowerCase()
      );
      i += add;
      if (this.stopKeywords.includes(currentWord)) {
        this.pushCurrentBlockToBlocks();
        continue;
      }
      switch (true) {
        case this.headingCase.includes(currentWord):
          this.pushCurrentBlockToBlocks();
          this.reetOrders();
          this.currentBlock.contentType =
            this.resolveHeadingContentType(currentWord);
          this.currentBlock.body = "";
          this.currentBlock.id = prefixTable(
            generateRandomIdv2(),
            Resource.node
          );
          break;

        case this.olCase.includes(currentWord):
          this.initializeListBlock(0, NodeType.ORDERED_LIST);
          // this.pushCurrentBlockToBlocks();
          // this.currentBlock.id = prefixTable(generateUID(), Resource.node);
          // this.currentBlock = JSON.parse(
          //   JSON.stringify(this.defaultListBlockValues)
          // );
          // this.currentBlock.listType = ListType.ORDERED;
          // this.lastCreatedOL = {};
          // this.lastCreatedOL = this.currentBlock;
          // this.lastCreatedListVariant = ListKeys.OL;
          break;

        case this.ulCase.includes(currentWord):
          this.initializeListBlock(0, NodeType.LIST);
          // this.pushCurrentBlockToBlocks();
          // this.currentBlock = JSON.parse(
          //   JSON.stringify(this.defaultListBlockValues)
          // );
          // this.currentBlock.id = prefixTable(generateUID(), Resource.node);
          // this.currentBlock.listType = ListType.UNORDERED;
          // this.lastCreatedUL = {};
          // this.lastCreatedUL = this.currentBlock;
          // this.lastCreatedListVariant = ListKeys.UL;
          break;

        case this.olChildCase.includes(currentWord):
          this.initializeListBlock(1, NodeType.ORDERED_LIST, 1);
          // this.pushCurrentBlockToBlocks();
          // this.currentBlock.id = prefixTable(generateUID(), Resource.node);
          // this.currentBlock = JSON.parse(
          //   JSON.stringify(this.defaultListBlockValues)
          // );
          // this.currentBlock.id = generateUID();
          // this.currentBlock.listType = ListType.ORDERED;
          // this.lastCreatedOLchild = {};
          // this.lastCreatedOLchild = this.currentBlock;
          // this.lastCreatedListVariant = ListKeys.OL_CHILD;
          break;

        case this.ulChildCase.includes(currentWord):
          this.initializeListBlock(1, NodeType.LIST);
          // this.pushCurrentBlockToBlocks();
          // this.currentBlock = JSON.parse(
          //   JSON.stringify(this.defaultListBlockValues)
          // );
          // this.currentBlock.id = generateUID();
          // this.currentBlock.listType = ListType.UNORDERED;
          // this.lastCreatedULchild = {};
          // this.lastCreatedULchild = this.currentBlock;
          // this.lastCreatedListVariant = ListKeys.UL_CHILD;
          break;

        case this.olSubChildCase.includes(currentWord):
          this.initializeListBlock(2, NodeType.ORDERED_LIST, 2);
          // this.pushCurrentBlockToBlocks();
          // this.currentBlock = JSON.parse(
          //   JSON.stringify(this.defaultListBlockValues)
          // );
          // this.currentBlock.id = generateUID();
          // this.currentBlock.listType = ListType.ORDERED;
          // this.lastCreatedOLsubchild = {};
          // this.lastCreatedOLsubchild = this.currentBlock;
          // this.lastCreatedListVariant = ListKeys.OL_SUB_CHILD;
          break;

        case this.ulSubChildCase.includes(currentWord):
          this.initializeListBlock(2, NodeType.LIST);
          // this.pushCurrentBlockToBlocks();
          // this.currentBlock = JSON.parse(
          //   JSON.stringify(this.defaultListBlockValues)
          // );
          // this.currentBlock.id = generateUID();
          // this.currentBlock.listType = ListType.UNORDERED;
          // this.lastCreatedULsubchild = {};
          // this.lastCreatedULsubchild = this.currentBlock;
          // this.lastCreatedListVariant = ListKeys.UL_SUB_CHILD;
          break;

        // case this.olSubSubChildCase.includes(currentWord):
        //   this.initializeListBlock(3, NodeType.ORDERED_LIST);
        // this.pushCurrentBlockToBlocks();
        // this.currentBlock = JSON.parse(
        //   JSON.stringify(this.defaultListBlockValues)
        // );
        // this.currentBlock.id = generateUID();
        // this.currentBlock.listType = ListType.ORDERED;
        // this.lastCreatedListVariant = ListKeys.OL_SUB_SUB_CHILD;
        // break;

        // case this.ulSubSubChildCase.includes(currentWord):
        //   this.initializeListBlock(3, NodeType.LIST);
        // this.pushCurrentBlockToBlocks();
        // this.currentBlock = JSON.parse(
        //   JSON.stringify(this.defaultListBlockValues)
        // );
        // this.currentBlock.id = generateUID();
        // this.currentBlock.listType = ListType.UNORDERED;
        // this.lastCreatedListVariant = ListKeys.UL_SUB_SUB_CHILD;
        // break;

        case this.todoCase.includes(currentWord):
          this.initializeListBlock(0, NodeType.CHECKLIST);
          break;
        case this.todoChildCase.includes(currentWord):
          this.initializeListBlock(1, NodeType.CHECKLIST);
          break;
        case this.todoSubChildCase.includes(currentWord):
          this.initializeListBlock(2, NodeType.CHECKLIST);
          break;
        case this.quoteCase.includes(currentWord):
          this.pushCurrentBlockToBlocks();
          this.reetOrders();
          this.currentBlock = reparse(this.defaultBlock);
          this.currentBlock.id = prefixTable(
            generateRandomIdv2(),
            Resource.node
          );
          this.currentBlock.contentType = NodeType.QUOTE;
          break;

        case this.dividerCase.includes(currentWord):
          this.pushCurrentBlockToBlocks();
          this.reetOrders();
          this.currentBlock = reparse(this.defaultBlock);
          this.currentBlock.id = prefixTable(
            generateRandomIdv2(),
            Resource.node
          );
          this.currentBlock.contentType = NodeType.DIVIDER;
          this.currentBlock.body = "";
          // this.pushCurrentBlockToBlocks();
          break;

        case this.doubleDividerCase.includes(currentWord):
          this.pushCurrentBlockToBlocks();
          this.reetOrders();
          this.currentBlock = reparse(this.defaultBlock);
          this.currentBlock.id = prefixTable(
            generateRandomIdv2(),
            Resource.node
          );
          this.currentBlock.contentType = NodeType.DOUBLE_DIVIDER;
          // this.pushCurrentBlockToBlocks();
          break;

        case this.simpleTextCase.includes(currentWord):
          this.pushCurrentBlockToBlocks();
          this.reetOrders();
          this.currentBlock = reparse(this.defaultBlock);
          this.currentBlock.id = prefixTable(
            generateRandomIdv2(),
            Resource.node
          );
          this.currentBlock.contentType = NodeType.SIMPLE_TEXT;
          break;

        case this.italicCase.includes(currentWord):
          if (typeof this.currentBlock.body == "object") {
            if (
              this.currentBlock.body.text &&
              this.currentBlock.body.text.length > 0
            )
              this.currentBlock.body.text += " " + "*";
            else this.currentBlock.body.text = "*";
          } else {
            if (this.currentBlock.body && this.currentBlock.body.length > 0)
              this.currentBlock.body += " " + "*";
            else this.currentBlock.body = "*";
          }
          break;

        case this.boldCase.includes(currentWord):
          if (typeof this.currentBlock.body == "object") {
            if (
              this.currentBlock.body.text &&
              this.currentBlock.body.text.length > 0
            )
              this.currentBlock.body.text += " " + "**";
            else this.currentBlock.body.text = "**";
          } else {
            if (this.currentBlock.body && this.currentBlock.body.length > 0)
              this.currentBlock.body += " " + "**";
            else this.currentBlock.body = "**";
          }
          break;

        default:
          if (typeof this.currentBlock.body == "object") {
            if (
              this.currentBlock.body.text &&
              this.currentBlock.body.text.length > 0
            )
              this.currentBlock.body.text += " " + casePreservedWord;
            else this.currentBlock.body.text = casePreservedWord;
          } else {
            if (this.currentBlock.body && this.currentBlock.body.length > 0)
              this.currentBlock.body += " " + casePreservedWord;
            else this.currentBlock.body = casePreservedWord;
          }
      }
    }
    this.pushCurrentBlockToBlocks();
  }

  convertAudioToMarkdown(transcript: string) {
    this.resetInitialStates();

    let processedTranscript = transcript
      .replace(/\[\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\]/g, " ")
      .replace(/\[[\d:]+\]/g, " ")
      .replace(/\([\d:]+\)/g, " ")
      .replace(/\d{1,2}:\d{2}:\d{2}[\s:]/g, " ")
      .replace(/\d{1,2}:\d{2}[\s:]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    let words: string[] = processedTranscript
      .split(/[,. ]+/)
      .filter((word: string) => word.length > 0);
    this.loopThroughAndDecode(words);

    if (this.blocks.length === 1) {
      this.splitByTimestampsAndPunctuation(transcript);
    }

    return this.blocks;
  }

  /**
   * Splits text by timestamps and punctuation when only one block is parsed
   * @param originalTranscript - The original transcript with timestamps
   */
  private splitByTimestampsAndPunctuation(originalTranscript: string) {
    const cleanText = originalTranscript
      .replace(/\[\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const sentences = cleanText.split(/\.(?!\w{2,4}(?:\s|$)|\d)(?=\s+[A-Z])/);

    if (sentences.length > 1) {
      const combined = this.combineShortSentences(sentences);

      if (combined.length > 1) {
        this.blocks = combined.map((sentence) => ({
          id: prefixTable(generateRandomIdv2(), Resource.node),
          contentType: NodeType.SIMPLE_TEXT,
          body: sentence.trim()
        }));
      }
    }
  }

  /**
   * Combines sentences that are too short to stand alone
   */
  private combineShortSentences(sentences: string[]): string[] {
    const minLength = 40;
    const result: string[] = [];
    let currentSentence = "";

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;

      const sentenceWithPeriod =
        i < sentences.length - 1 ? sentence + "." : sentence;

      currentSentence += (currentSentence ? " " : "") + sentenceWithPeriod;

      const shouldEnd =
        currentSentence.length >= minLength || i === sentences.length - 1;

      if (shouldEnd) {
        result.push(currentSentence);
        currentSentence = "";
      }
    }

    if (currentSentence.trim()) {
      if (result.length > 0) {
        result[result.length - 1] += " " + currentSentence;
      } else {
        result.push(currentSentence);
      }
    }

    return result.filter((s) => s.trim().length > 0);
  }
}

export const Audio2MD = new AudioToMarkdown();
