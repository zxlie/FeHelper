window.Tracker = window.Tracker || {};

Tracker.StatusPool = function(){
    var arrivedSnippetGroupCache, snippetToGroupIdCache, snippetGroupCoverLineCache,
        snippetGroupToCodeCache, code, i, id, l, t, groupId, currentArrivedSnippetGroupFlag;

    arrivedSnippetGroupCache = {}; // 已到达的碎片组（所有代码）
    snippetToGroupIdCache = {}; // 碎片到碎片组的映射（所有代码）
    snippetGroupCoverLineCache = {}; // 碎片组覆盖代码行数（所有代码）
    snippetGroupToCodeCache = {}; // 碎片组到代码的映射
    currentArrivedSnippetGroupFlag = 1; // 当前已到达的代码碎片组标识    0:未到达  1:已到达  2,4,8.. 其他扩展

    return {
        snippetGroupCreate: function( code, snippetIds ){
            groupId = Tracker.Util.nid();
            for( i = 0, l = snippetIds.length; i < l; i ++ )
                snippetToGroupIdCache[ snippetIds[ i ] ] = groupId;
            snippetGroupToCodeCache[ groupId ] = code;
            return groupId;
        },

        arrivedSnippetGroupFlagSet: function( flagNum ){
            currentArrivedSnippetGroupFlag = flagNum;
        },

        arrivedSnippetGroupPut: function( groupId ){
            t = arrivedSnippetGroupCache[ groupId ];

            if( !( t & currentArrivedSnippetGroupFlag ) ){
                arrivedSnippetGroupCache[ groupId ] = ( t + currentArrivedSnippetGroupFlag ) ||
                currentArrivedSnippetGroupFlag;

                if( snippetGroupCoverLineCache[ groupId ] ){
                    code = snippetGroupToCodeCache[ groupId ];
                    code.arriveRowsCount += snippetGroupCoverLineCache[ groupId ];
                    code.lastModified = Tracker.Util.time();
                    snippetGroupCoverLineCache[ groupId ] = 0;
                }
            }
        },

        arrivedSnippetGroupDelete: function( groupId, flagNum ){
            t = arrivedSnippetGroupCache[ groupId ];
            if( t == flagNum )
                arrivedSnippetGroupCache[ groupId ] = 1;
            else if( t & flagNum )
                arrivedSnippetGroupCache[ groupId ] -= flagNum;
        },

        arrivedSnippetGet: function( snippetId ){
            return arrivedSnippetGroupCache[ snippetToGroupIdCache[ snippetId ] ];
        },

        snippetGroupToCodeGet: function( groupId ){
            return snippetGroupToCodeCache[ groupId ];
        },

        snippetGroupCoverLineAdd: function( snippetId ){
            groupId = snippetToGroupIdCache[ snippetId ];
            snippetGroupCoverLineCache[ groupId ] =
                ++ snippetGroupCoverLineCache[ groupId ] || 1;
        }
    }
}();
